

from pydantic import BaseModel

class UserRead(BaseModel):
    id: int
    email: str
    username: str | None = None
    role: str | None = None

    class Config:
        from_attributes = True 

class UserCreate(BaseModel):
    email: str
    password: str
    username: str | None = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    username: str

class PhotoCreate(BaseModel):
    title: str
    description: str
    category: str
    price: float

class PhotoRead(BaseModel):
    id: int
    title: str
    description: str
    category: str
    price: float
    file_path: str
    owner_id: int

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    new_role: str
