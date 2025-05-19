# app/schemas.py
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr


# ------------------------------------------------------------------
# User schemas
# ------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    role: str = "user"
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    banned: bool = False                # domyślnie konto nie­zablokowane


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None


class UserRoleUpdate(BaseModel):
    new_role: str


class UserRead(UserBase):
    id: int
    banned: bool

    class Config:
        from_attributes = True           # Pydantic v2 (odpowiednik orm_mode)


# ------------------------------------------------------------------
# Photo schemas
# ------------------------------------------------------------------
class PhotoBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = 0.0
    file_path: Optional[str] = None
    thumb_path: Optional[str] = None


class PhotoCreate(BaseModel):
    title: str
    description: str
    category: List[str]
    price: float


class PhotoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None


class PhotoRead(PhotoBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


class PhotoOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = 0.0
    file_path: Optional[str] = None
    thumb_path: Optional[str] = None
    owner_id: int
    owner_username: Optional[str] = None
    file_url: Optional[str] = None
    thumb_url: Optional[str] = None
    category_ids: List[int] = []

    class Config:
        from_attributes = True



# ------------------------------------------------------------------
# Category schemas
# ------------------------------------------------------------------
class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True



# ------------------------------------------------------------------
# PhotoCategory schemas
# ------------------------------------------------------------------
class PhotoCategory(BaseModel):
    photo_id: int
    category_id: int


# ------------------------------------------------------------------
# Cart / Order / Payment / Purchase schemas
# ------------------------------------------------------------------
class CartRead(BaseModel):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class CartItemRead(BaseModel):
    id: int
    cart_id: int
    photo_id: int

    class Config:
        from_attributes = True


class OrderRead(BaseModel):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True


class OrderItemRead(BaseModel):
    id: int
    order_id: int
    photo_id: int
    price: Optional[float] = None
    access_url: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentRead(BaseModel):
    id: int
    order_id: int
    provider: Optional[str] = None
    status: Optional[str] = None
    payment_date: Optional[datetime] = None
    transaction_id: Optional[str] = None

    class Config:
        from_attributes = True


class PurchaseRead(BaseModel):
    id: int
    user_id: int
    photo_id: int
    purchase_date: Optional[datetime] = None
    payment_status: Optional[str] = None
    total_cost: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
