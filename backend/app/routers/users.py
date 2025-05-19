# app/routers/users.py
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import SessionLocal
from app.dependencies import (
    get_current_user,
    check_admin,
    ensure_not_banned,        # przydaje się w innych routerach, np. photos.upload
)
from app.security import create_access_token, verify_token

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --------------------------------------------------------------------
# Pydantic helpers
# --------------------------------------------------------------------
class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    token: str


class BanStatus(BaseModel):
    banned: bool

class FullBanStatus(BaseModel):
    full_banned: bool


# --------------------------------------------------------------------
# DB session dependency
# --------------------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------------------------
# Helper to create refresh-token
# --------------------------------------------------------------------
def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode = {"sub": str(user_id), "exp": expire, "token_type": "refresh"}
    return create_access_token(to_encode, expires_delta=None)


# --------------------------------------------------------------------
# Auth & profile endpoints
# --------------------------------------------------------------------
@router.post("/register", response_model=schemas.UserRead)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Użytkownik z takim e-mailem już istnieje.")

    if user_data.username and db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Nazwa użytkownika jest już zajęta.")

    new_user = models.User(
        email=user_data.email,
        hashed_password=pwd_context.hash(user_data.password),
        username=user_data.username,
        banned=user_data.banned,
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

    if user.full_banned:
        raise HTTPException(status_code=403, detail="Twoje konto jest zablokowane!")

    access_token = create_access_token(
        data={"sub": str(user.id), "token_type": "access"},
        expires_delta=timedelta(minutes=30),
    )
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "banned": user.banned,
    }



@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = verify_token(req.token)
    if payload is None or payload.get("token_type") != "refresh":
        raise HTTPException(status_code=401, detail="Nieprawidłowy lub wygasły refresh token")

    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")

    new_access = create_access_token(
        data={"sub": str(user.id), "token_type": "access"},
        expires_delta=timedelta(minutes=30),
    )
    return TokenResponse(access_token=new_access, refresh_token=req.token)


@router.get("/me", response_model=schemas.UserRead)
def get_current_user_info(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/update", response_model=schemas.UserRead)
def update_user(
    user_update: schemas.UserUpdate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.username = user_update.username
    db.commit()
    db.refresh(user)
    return user


@router.delete("/delete", status_code=204)
def delete_user(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()


@router.put("/change-password")
def change_password(
    data: PasswordChange,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")
    if not pwd_context.verify(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Stare hasło jest nieprawidłowe")

    user.hashed_password = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Hasło zostało zmienione"}


# --------------------------------------------------------------------
# Admin-only endpoints
# --------------------------------------------------------------------
@router.get("/all", response_model=List[schemas.UserRead])
def get_all_users(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_admin),
):
    return db.query(models.User).all()


@router.put("/set-role/{user_id}", response_model=schemas.UserRead)
def set_user_role(
    user_id: int,
    role_data: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role_data.new_role
    db.commit()
    db.refresh(user)
    return user


@router.put("/ban/{user_id}", response_model=schemas.UserRead)
def set_ban_status(
    user_id: int,
    status: BanStatus,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.banned = status.banned
    db.commit()
    db.refresh(user)
    return user

@router.put("/full-ban/{user_id}", response_model=schemas.UserRead)
def toggle_full_ban(
    user_id: int,
    status: FullBanStatus,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.full_banned = status.full_banned
    db.commit()
    db.refresh(user)
    return user


