from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import Conversation, Message, MessageStatus, Product, User
from backend.app.schemas import (
    ConversationCreate,
    ConversationResponse,
    ConversationProductSummary,
    MessageCreate,
    MessageResponse,
    UserSummary,
)

router = APIRouter()


def _user_summary(user: User) -> UserSummary:
    return UserSummary(id=user.id, email=user.email, full_name=user.full_name)


def _product_summary(product: Product) -> ConversationProductSummary:
    return ConversationProductSummary(
        id=product.id,
        name=product.name,
        price=float(product.price),
        location=product.location,
        image_urls=product.image_urls or [],
    )


def _message_response(message: Message) -> MessageResponse:
    status_value = message.status.value if isinstance(message.status, MessageStatus) else message.status
    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        status=status_value,
        sent_at=message.sent_at,
        delivered_at=message.delivered_at,
        read_at=message.read_at,
    )


def _conversation_response(
    conversation: Conversation,
    last_message: Optional[Message] = None,
) -> ConversationResponse:
    # Avoid triggering lazy loads in async contexts; use already-loaded messages only
    messages = conversation.__dict__.get("messages")
    if last_message is None and messages:
        last_message = sorted(messages, key=lambda m: m.sent_at)[-1]
    return ConversationResponse(
        id=conversation.id,
        product=_product_summary(conversation.product),
        buyer=_user_summary(conversation.buyer),
        seller=_user_summary(conversation.seller),
        created_at=conversation.created_at,
        last_message=_message_response(last_message) if last_message else None,
    )


async def _get_conversation_or_404(
    conversation_id: UUID, current_user: User, db: AsyncSession
) -> Conversation:
    result = await db.execute(
        select(Conversation)
        .options(
            selectinload(Conversation.product),
            selectinload(Conversation.buyer),
            selectinload(Conversation.seller),
        )
        .where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation or (
        conversation.buyer_id != current_user.id
        and conversation.seller_id != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation


async def _bulk_update_status(
    *,
    conversation: Conversation,
    current_user: User,
    db: AsyncSession,
    target_status: MessageStatus,
    allowed_statuses: list[MessageStatus],
):
    now = datetime.utcnow()
    values = {"status": target_status.value}
    if target_status in (MessageStatus.DELIVERED, MessageStatus.READ):
        values["delivered_at"] = now
    if target_status == MessageStatus.READ:
        values["read_at"] = now

    result = await db.execute(
        update(Message)
        .where(
            Message.conversation_id == conversation.id,
            Message.receiver_id == current_user.id,
            Message.status.in_([s.value for s in allowed_statuses]),
        )
        .values(**values)
        .returning(Message.id)
    )
    updated = len(result.fetchall())
    await db.commit()
    return {"updated": updated}


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await _get_conversation_or_404(conversation_id, current_user, db)
    await db.delete(conversation)
    await db.commit()
    return


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.seller))
        .where(Product.id == payload.product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.seller_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot start a conversation with your own listing",
        )

    existing_result = await db.execute(
        select(Conversation)
        .options(
            selectinload(Conversation.product),
            selectinload(Conversation.buyer),
            selectinload(Conversation.seller),
        )
        .where(
            Conversation.product_id == product.id,
            Conversation.buyer_id == current_user.id,
            Conversation.seller_id == product.seller_id,
        )
    )
    conversation = existing_result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(
            product_id=product.id,
            buyer_id=current_user.id,
            seller_id=product.seller_id,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        # refresh relationships
        await db.refresh(conversation, attribute_names=["product", "buyer", "seller"])
    return _conversation_response(conversation)


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .options(
            selectinload(Conversation.product),
            selectinload(Conversation.buyer),
            selectinload(Conversation.seller),
            selectinload(Conversation.messages),
        )
        .where(
            or_(
                Conversation.buyer_id == current_user.id,
                Conversation.seller_id == current_user.id,
            )
        )
        .order_by(Conversation.created_at.desc())
    )
    conversations = result.scalars().unique().all()
    return [_conversation_response(conv) for conv in conversations]


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await _get_conversation_or_404(conversation_id, current_user, db)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.sent_at.asc())
    )
    messages = result.scalars().all()
    return [_message_response(message) for message in messages]


@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: UUID,
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await _get_conversation_or_404(conversation_id, current_user, db)
    receiver_id = (
        conversation.seller_id if current_user.id == conversation.buyer_id else conversation.buyer_id
    )
    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        receiver_id=receiver_id,
        content=body.content,
        status=MessageStatus.SENT.value,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return _message_response(message)


@router.post("/{conversation_id}/delivered")
async def mark_delivered(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await _get_conversation_or_404(conversation_id, current_user, db)
    return await _bulk_update_status(
        conversation=conversation,
        current_user=current_user,
        db=db,
        target_status=MessageStatus.DELIVERED,
        allowed_statuses=[MessageStatus.SENT],
    )


@router.post("/{conversation_id}/read")
async def mark_read(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await _get_conversation_or_404(conversation_id, current_user, db)
    return await _bulk_update_status(
        conversation=conversation,
        current_user=current_user,
        db=db,
        target_status=MessageStatus.READ,
        allowed_statuses=[MessageStatus.SENT, MessageStatus.DELIVERED],
    )
