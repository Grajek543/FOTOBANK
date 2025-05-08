from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import timedelta, datetime
from typing import List, Optional
from pydantic import BaseModel

from app.database import SessionLocal
from app import models, schemas
from app.security import create_access_token, verify_token
from app.dependencies import get_current_user, check_admin  

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str

class RefreshRequest(BaseModel):
    token: str  

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "token_type": "refresh"
    }

    return create_access_token(to_encode, expires_delta=None)

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
def login(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user or not pwd_context.verify(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Nieprawidłowe dane logowania.")

    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id), "token_type": "access"},
        expires_delta=access_token_expires
    )

    refresh_token = create_refresh_token(user.id, timedelta(days=7))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    refresh_jwt = req.token
    payload = verify_token(refresh_jwt)
    if payload is None or payload.get("token_type") != "refresh":
        raise HTTPException(status_code=401, detail="Nieprawidłowy lub wygasły refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token nie zawiera user_id")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    new_access_token = create_access_token(
        data={"sub": str(user.id), "token_type": "access"},
        expires_delta=timedelta(minutes=30)
    )

    return TokenResponse(access_token=new_access_token, refresh_token=refresh_jwt)

@router.get("/me", response_model=schemas.UserRead)
def get_current_user_info(current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/update", response_model=schemas.UserRead)
def update_user(user_update: schemas.UserUpdate, current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.username = user_update.username
    db.commit()
    db.refresh(user)
    return user

@router.delete("/delete", status_code=204)
def delete_user(current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()

@router.put("/change-password")
def change_password(data: PasswordChange, current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")

    if not pwd_context.verify(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Stare hasło jest nieprawidłowe")

    user.hashed_password = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Hasło zostało zmienione"}

@router.get("/all", response_model=List[schemas.UserRead])
def get_all_users(db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    return db.query(models.User).all()

@router.put("/set-role/{user_id}", response_model=schemas.UserRead)
def set_user_role(user_id: int, role_data: schemas.UserRoleUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role_data.new_role
    db.commit()
    db.refresh(user)
    return user
