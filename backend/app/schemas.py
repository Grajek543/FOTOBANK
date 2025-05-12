from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ---------------------------
# User schemas
# ---------------------------
class UserBase(BaseModel):
    email: str
    username: Optional[str] = None
    role: Optional[str] = "user"
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None

class UserRoleUpdate(BaseModel):
    new_role: str

class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True

# ---------------------------
# Photo schemas
# ---------------------------
class PhotoBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = 0.0
    file_path: Optional[str] = None
    thumb_path: Optional[str] = None

class PhotoCreate(PhotoBase):
    pass

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
    price: Optional[float] = 0.0
    file_path: Optional[str] = None
    thumb_path: Optional[str] = None
    owner_id: int
    owner_username: Optional[str] = None
    file_url: str | None = None   # ← nowe
    thumb_url: str | None = None  # ← nowe

    class Config:
        from_attributes = True



# ---------------------------
# Category schemas
# ---------------------------
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# ---------------------------
# PhotoCategory schemas
# ---------------------------
class PhotoCategory(BaseModel):
    photo_id: int
    category_id: int

# ---------------------------
# Cart schemas
# ---------------------------
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

# ---------------------------
# Order schemas
# ---------------------------
class OrderRead(BaseModel):
    id: int
    user_id: int
    created_at: Optional[datetime]
    status: Optional[str]

    class Config:
        from_attributes = True

class OrderItemRead(BaseModel):
    id: int
    order_id: int
    photo_id: int
    price: Optional[float]
    access_url: Optional[str]

    class Config:
        from_attributes = True

# ---------------------------
# Payment schemas
# ---------------------------
class PaymentRead(BaseModel):
    id: int
    order_id: int
    provider: Optional[str]
    status: Optional[str]
    payment_date: Optional[datetime]
    transaction_id: Optional[str]

    class Config:
        from_attributes = True

# ---------------------------
# Purchase schemas
# ---------------------------
class PurchaseRead(BaseModel):
    id: int
    user_id: int
    photo_id: int
    purchase_date: Optional[datetime]
    payment_status: Optional[str]
    total_cost: Optional[float]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
