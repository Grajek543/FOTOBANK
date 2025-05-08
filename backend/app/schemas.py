from typing import Optional
from pydantic import BaseModel

# ───────────── USERS ─────────────

class UserRead(BaseModel):
    id: int
    email: str
    username: Optional[str] = None
    role: Optional[str] = None

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    email: str
    password: str
    username: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdate(BaseModel):
    username: str


class UserRoleUpdate(BaseModel):
    new_role: str


# ───────────── PHOTOS ─────────────

class PhotoBase(BaseModel):
    title: str
    description: str
    category: str
    price: float


class PhotoCreate(PhotoBase):
    pass


class PhotoUpdate(BaseModel):
    title: str
    description: str


class PhotoOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    price: float
    file_url: str
    thumb_url: Optional[str] = None

    class Config:
        orm_mode = True
