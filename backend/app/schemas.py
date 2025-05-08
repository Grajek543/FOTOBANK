from typing import Optional
from pydantic import BaseModel, Field


# ───────────── USERS ─────────────

class UserRead(BaseModel):
    id: int
    email: str
    username: str | None = None
    role: str | None = None  # ← potrzebne do panelu admina

    class Config:
        from_attributes = True  # fastapi ≥ 0.100, pydantic ≥ 2


class UserCreate(BaseModel):
    email: str
    password: str
    username: str | None = None


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
    pass  # ⬅️ możesz dodać więcej pól jeśli będzie potrzeba


class PhotoUpdate(BaseModel):
    title: str
    description: str


class PhotoOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    price: float
    file_url: str               # ← do wyświetlania pliku (foto/wideo)
    thumb_url: str | None = None  # ← miniatura, jeśli istnieje

    class Config:
        from_attributes = True  # fastapi ≥ 0.100
