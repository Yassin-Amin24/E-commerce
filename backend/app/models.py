from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from enum import Enum
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    listings = relationship("Product", back_populates="seller")
    buyer_conversations = relationship(
        "Conversation",
        back_populates="buyer",
        foreign_keys="Conversation.buyer_id",
    )
    seller_conversations = relationship(
        "Conversation",
        back_populates="seller",
        foreign_keys="Conversation.seller_id",
    )
    sent_messages = relationship(
        "Message",
        back_populates="sender",
        foreign_keys="Message.sender_id",
    )
    received_messages = relationship(
        "Message",
        back_populates="receiver",
        foreign_keys="Message.receiver_id",
    )

class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    location = Column(String, nullable=False)
    image_urls = Column(JSONB, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    seller = relationship("User", back_populates="listings")
    conversations = relationship("Conversation", back_populates="product")

class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="conversations")
    buyer = relationship("User", back_populates="buyer_conversations", foreign_keys=[buyer_id])
    seller = relationship("User", back_populates="seller_conversations", foreign_keys=[seller_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('product_id', 'buyer_id', 'seller_id', name='unique_conversation'),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(
        SAEnum(
            MessageStatus,
            name="message_status",
            create_constraint=False,  # enum type already exists from migration
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
        ),
        nullable=False,
        default=MessageStatus.SENT.value,
        server_default=MessageStatus.SENT.value,
    )
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
