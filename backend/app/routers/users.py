# app/routers/users.py
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session
import random
import smtplib
from email.mime.text import MIMEText

from app import models, schemas
from app.database import SessionLocal
from app.dependencies import get_current_user, check_admin
from app.security import create_access_token, verify_token

from dotenv import load_dotenv
import os
load_dotenv()
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ----------------------------- MODELE -----------------------------
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

class ActivationRequest(BaseModel):
    email: str
    code: str

class ResendRequest(BaseModel):
    email: str


# ----------------------------- DB SESSION -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------------- TOKENY -----------------------------
def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode = {"sub": str(user_id), "exp": expire, "token_type": "refresh"}
    return create_access_token(to_encode, expires_delta=None)


# ----------------------------- EMAIL -----------------------------
def send_activation_email(to_email: str, code: str, purpose: str = "activation"):
    if purpose == "activation":
        subject = "FotoBank – Aktywacja konta"
        body = f"""
Cześć!

Dziękujemy za rejestrację w FotoBank.

Twój kod aktywacyjny to: {code}

Wprowadź go w aplikacji, aby aktywować konto.

Pozdrawiamy,
Zespół FotoBank
"""
    elif purpose == "reset":
        subject = "FotoBank – Reset hasła"
        body = f"""
Cześć!

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w FotoBank.

Twój kod resetujący to: {code}

Wprowadź go w aplikacji, aby ustawić nowe hasło.

Jeśli to nie Ty prosiłeś o reset hasła, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół FotoBank
"""
    else:
        raise ValueError("Nieznany typ wiadomości e-mail (activation/reset).")

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = EMAIL_USER
    message["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(message)
            print(f"[EMAIL] ({purpose}) wysłany do: {to_email} (kod: {code})")
    except Exception as e:
        print(f"[ERROR] Nie udało się wysłać maila ({purpose}) do {to_email}: {e}")




# ----------------------------- REGISTER + LOGIN -----------------------------
@router.post("/register", response_model=schemas.UserRead)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Użytkownik z takim e-mailem już istnieje.")

    if user_data.username and db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Nazwa użytkownika jest już zajęta.")

    code = f"{random.randint(100000, 999999)}"

    new_user = models.User(
        email=user_data.email,
        hashed_password=pwd_context.hash(user_data.password),
        username=user_data.username,
        is_active=False,
        activation_code=code
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_activation_email(user.email, new_code, purpose="activation")

    return new_user


@router.post("/activate")
def activate_account(data: ActivationRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or user.activation_code != data.code:
        raise HTTPException(status_code=400, detail="Nieprawidłowy kod aktywacyjny.")

    user.is_active = True
    user.activation_code = None
    db.commit()
    return {"message": "Konto aktywowane"}


@router.post("/login")
def login(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email).first()

    if not user or not pwd_context.verify(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Nieprawidłowe dane logowania.")

    if user.full_banned:
        raise HTTPException(status_code=403, detail="Twoje konto zostało zablokowane !!!")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Twoje konto nie zostało aktywowane. Sprawdź e-mail.")


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



# ----------------------------- REFRESH -----------------------------
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


# ----------------------------- ME / UPDATE / DELETE -----------------------------
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


# ----------------------------- ADMIN -----------------------------
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


@router.put("/ban/{user_id}", response_model=schemas.UserRead)
def set_ban_status(user_id: int, status: BanStatus, db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.banned = status.banned
    db.commit()
    db.refresh(user)
    return user


@router.put("/full-ban/{user_id}", response_model=schemas.UserRead)
def toggle_full_ban(user_id: int, status: FullBanStatus, db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.full_banned = status.full_banned
    db.commit()
    db.refresh(user)
    return user
# ----------------------------- AKTYWACJA -----------------------------
@router.post("/resend-code")
def resend_activation_code(data: ResendRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje.")
    if user.is_active:
        raise HTTPException(status_code=400, detail="Konto już aktywowane.")

    new_code = f"{random.randint(100000, 999999)}"
    user.activation_code = new_code
    db.commit()
    send_activation_email(user.email, new_code, purpose="activation")
    return {"message": "Kod aktywacyjny został wysłany ponownie."}

class ResetPasswordRequest(BaseModel):
    email: str

# ----------------------------- PRZYWRACANIE HASŁA -----------------------------
@router.post("/request-password-reset")
def request_password_reset(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje.")

    code = f"{random.randint(100000, 999999)}"
    user.activation_code = code
    db.commit()
    send_activation_email(user.email, code, purpose="reset")
    return {"message": "Kod resetowania został wysłany na e-mail."}


class PasswordReset(BaseModel):
    email: str
    code: str
    new_password: str

@router.post("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or user.activation_code != data.code:
        raise HTTPException(status_code=400, detail="Nieprawidłowy kod resetujący lub e-mail.")

    user.hashed_password = pwd_context.hash(data.new_password)
    user.activation_code = None
    db.commit()
    return {"message": "Hasło zostało zaktualizowane."}


