from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import timedelta
from pydantic import BaseModel

from app import schemas, models
from app.database import SessionLocal
from app.security import create_access_token
from app.dependencies import get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.UserRead)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Użytkownik z takim e-mailem już istnieje.")

    if user_data.username:
        existing_username = db.query(models.User).filter(models.User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Nazwa użytkownika jest już zajęta.")

    hashed_password = pwd_context.hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        username=user_data.username
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Nieprawidłowy login lub hasło.")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role
    }

@router.get("/me", response_model=schemas.UserRead)
def get_current_user_info(current_user_id: int = Depends(get_current_user),
                          db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/update", response_model=schemas.UserRead)
def update_user(user_update: schemas.UserUpdate,
                current_user_id: int = Depends(get_current_user),
                db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.username = user_update.username
    db.commit()
    db.refresh(user)
    return user

@router.delete("/delete", status_code=204)
def delete_user(current_user_id: int = Depends(get_current_user),
                db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

@router.put("/change-password")
def change_password(data: PasswordChange,
                    current_user_id: int = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")

    if not pwd_context.verify(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Stare hasło jest nieprawidłowe")

    user.hashed_password = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Hasło zostało zmienione"}
