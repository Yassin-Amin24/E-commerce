from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional
from backend.app.database import get_db
from backend.app.models import Product, User, Conversation
from backend.app.schemas import (
    ProductResponse,
    ProductListResponse,
    ProductCreate,
    UserSummary,
)
from backend.app.auth import get_current_user
from uuid import UUID

router = APIRouter()

def user_to_summary(user: User) -> UserSummary:
    return UserSummary(id=user.id, email=user.email, full_name=user.full_name)


def product_to_response(product: Product) -> ProductResponse:
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=float(product.price),
        location=product.location,
        image_urls=product.image_urls or [],
        created_at=product.created_at,
        seller=user_to_summary(product.seller),
    )


@router.get("/mine", response_model=ProductListResponse)
async def get_my_products(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.seller))
        .where(Product.seller_id == current_user.id)
        .order_by(Product.created_at.desc())
    )
    products = result.scalars().all()
    responses = [product_to_response(p) for p in products]
    return ProductListResponse(products=responses, total=len(responses))

@router.get("", response_model=ProductListResponse)
async def get_products(
    search: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Product).options(selectinload(Product.seller))
    conditions = []
    
    if search:
        conditions.append(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Product.location.ilike(f"%{search}%")
            )
        )
    
    if min_price is not None:
        conditions.append(Product.price >= min_price)
    
    if max_price is not None:
        conditions.append(Product.price <= max_price)
    
    if location:
        conditions.append(Product.location.ilike(f"%{location}%"))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(Product.created_at.desc())
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    # Convert to response with dynamic arrival dates
    product_responses = [product_to_response(p) for p in products]
    
    return ProductListResponse(products=product_responses, total=len(product_responses))

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
            .options(selectinload(Product.seller))
            .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product_to_response(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    product = Product(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        location=product_data.location,
        image_urls=product_data.image_urls,
        seller_id=current_user.id,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    await db.refresh(product, attribute_names=["seller"])
    return product_to_response(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.conversations).selectinload(Conversation.messages),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    if product.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this listing",
        )

    # Remove any related conversations so the FK constraint on products is satisfied
    for conversation in list(product.conversations or []):
        await db.delete(conversation)

    await db.delete(product)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
