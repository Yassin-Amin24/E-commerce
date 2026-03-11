from pydantic import BaseModel, Field, constr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

# Auth schemas
class UserSignup(BaseModel):
    # Lightweight email format check that still allows test domains
    email: constr(strip_whitespace=True, min_length=3, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    full_name: str
    password: str = Field(min_length=6, max_length=72)

class UserLogin(BaseModel):
    email: constr(strip_whitespace=True, min_length=3, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=1, max_length=72)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    id: UUID
    email: str
    full_name: str
    
    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: constr(strip_whitespace=True, min_length=2)
    # Allow shorter blurbs while still requiring some detail
    description: constr(strip_whitespace=True, min_length=4)
    price: float = Field(gt=0)
    location: constr(strip_whitespace=True, min_length=2)
    image_urls: List[constr(strip_whitespace=True, min_length=5)] = Field(min_length=1)

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    seller: UserSummary
    
    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int

class MessageStatus(str, Enum):
    sent = "sent"
    delivered = "delivered"
    read = "read"


class ConversationProductSummary(BaseModel):
    id: UUID
    name: str
    price: float
    location: str
    image_urls: List[str]

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    product_id: UUID


class ConversationResponse(BaseModel):
    id: UUID
    product: ConversationProductSummary
    buyer: UserSummary
    seller: UserSummary
    created_at: datetime
    last_message: Optional["MessageResponse"] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: constr(strip_whitespace=True, min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    status: MessageStatus
    sent_at: datetime
    delivered_at: Optional[datetime]
    read_at: Optional[datetime]

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]


ConversationResponse.model_rebuild()
