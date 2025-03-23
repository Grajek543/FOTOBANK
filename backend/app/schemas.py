# app/schemas.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=6)

class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: str

    class Config:
        orm_mode = True

class PhotoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = 0.0

    # Bez file_path, bo to będzie nadawane po uploadzie

class PhotoRead(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    price: float

    class Config:
        orm_mode = True
        
class UserLogin(BaseModel):
    email: EmailStr
    password: constr(min_length=6)