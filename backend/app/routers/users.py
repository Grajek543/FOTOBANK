# app/routers/users.py
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
import random
import smtplib
from email.mime.text import MIMEText
from pathlib import Path

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
def register_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    # 1) walidacja unikalności
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(400, "Użytkownik z takim e-mailem już istnieje.")
    if user_data.username and db.query(models.User).filter(
        models.User.username == user_data.username
    ).first():
        raise HTTPException(400, "Nazwa użytkownika jest już zajęta.")

    # 2) przygotowanie danych
    activation_code = f"{random.randint(100000, 999999)}"
    pwd_hash = pwd_context.hash(user_data.password)

    try:
        # 3) ręczna transakcja: oba INSERTy, potem commit albo rollback
        # 3a) Wstawiamy użytkownika
        insert_user_sql = text("""
            INSERT INTO users
              (email, username, hashed_password, role, banned, full_banned, is_active, activation_code)
            VALUES
              (:email, :username, :pwd_hash, 'user', 0, 0, 0, :code)
        """)
        result = db.execute(
            insert_user_sql,
            {
                "email": user_data.email,
                "username": user_data.username,
                "pwd_hash": pwd_hash,
                "code": activation_code,
            },
        )
        user_id = result.lastrowid
        if not user_id:
            raise RuntimeError("Brak lastrowid z INSERT users")

        # 3b) Wstawiamy koszyk
        db.execute(
            text("INSERT INTO cart (user_id) VALUES (:user_id)"),
            {"user_id": user_id},
        )

        # 3c) zatwierdzamy oba INSERTy
        db.commit()
    except Exception as e:
        # w razie błędu wycofujemy i zwracamy 400
        db.rollback()
        raise HTTPException(400, f"Rejestracja nie powiodła się: {e}")

    # 4) pobieramy ORM-owo świeżo utworzonego użytkownika
    new_user = db.query(models.User).get(user_id)
    if not new_user:
        raise HTTPException(500, "Nie udało się wczytać nowego użytkownika.")

    # 5) wysyłamy maila aktywacyjnego
    send_activation_email(new_user.email, activation_code, purpose="activation")

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
    stmt = text("""
        SELECT id, email, username, role, banned, full_banned, is_active 
        FROM users WHERE id = :uid
    """)
    row = db.execute(stmt, {"uid": current_user_id}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)



@router.put("/update", response_model=schemas.UserRead)
def update_user(user_update: schemas.UserUpdate, current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(text("""
        UPDATE users SET username = :username WHERE id = :uid
    """), {"username": user_update.username, "uid": current_user_id})
    db.commit()

    row = db.execute(text("""
        SELECT id, email, username, role, banned, full_banned, is_active 
        FROM users WHERE id = :uid
    """), {"uid": current_user_id}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found after update")
    return dict(row)



@router.delete("/delete", status_code=204)
def delete_user(current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": current_user_id})
    db.commit()



@router.put("/change-password")
def change_password(data: PasswordChange, current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.execute(text("""
        SELECT hashed_password FROM users WHERE id = :uid
    """), {"uid": current_user_id}).mappings().first()

    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie znaleziony")

    if not pwd_context.verify(data.old_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Stare hasło jest nieprawidłowe")

    new_hash = pwd_context.hash(data.new_password)
    db.execute(text("UPDATE users SET hashed_password = :pwd WHERE id = :uid"), {
        "pwd": new_hash, "uid": current_user_id
    })
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


@router.get("/stats/users")
def user_stats(db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    result = db.execute(text("SELECT get_user_stats()")).scalar()
    import json
    return json.loads(result)

@router.get("/stats/photos")
def photo_stats(db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    result = db.execute(text("SELECT get_photo_stats()")).scalar()
    import json
    return json.loads(result)

@router.get("/stats/my-photos")
def my_photo_stats(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = text("""
        SELECT
          (SELECT COUNT(*) FROM photos WHERE owner_id = :uid)                         AS photos_total,
          (SELECT ROUND(AVG(price),2) FROM photos WHERE owner_id = :uid)             AS photos_avg_price,
          (SELECT COUNT(*)                                                           
             FROM photos p
             LEFT JOIN photo_categories pc ON p.id = pc.photo_id
             WHERE p.owner_id = :uid
               AND pc.photo_id IS NULL
          )                                                                           AS photos_without_category,
          (SELECT COUNT(DISTINCT pu.photo_id)                                         
             FROM purchases pu
             JOIN photos p ON pu.photo_id = p.id
             WHERE p.owner_id = :uid
          )                                                                           AS photos_with_purchases
    """)
    row = db.execute(stmt, {"uid": current_user_id}).one()
    return {
        "photos_total": row.photos_total,
        "photos_avg_price": float(row.photos_avg_price or 0),
        "photos_without_category": row.photos_without_category,
        "photos_with_purchases": row.photos_with_purchases,
    }

@router.get("/stats/my-purchases")
def my_purchase_stats(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = text("""
        SELECT
          (SELECT COUNT(*)                 FROM purchases WHERE user_id = :uid)   AS purchases_total,
          (SELECT ROUND(SUM(total_cost),2) FROM purchases WHERE user_id = :uid)   AS revenue_total,
          (SELECT ROUND(AVG(total_cost),2) FROM purchases WHERE user_id = :uid)   AS avg_purchase_value,
          (SELECT COUNT(DISTINCT photo_id)  FROM purchases WHERE user_id = :uid)   AS distinct_photos_bought
    """)
    row = db.execute(stmt, {"uid": current_user_id}).one()
    return {
        "purchases_total": row.purchases_total,
        "revenue_total": float(row.revenue_total or 0),
        "avg_purchase_value": float(row.avg_purchase_value or 0),
        "distinct_photos_bought": row.distinct_photos_bought,
    }

# ----------------------------- HISTORIA TRANSAKCJI -----------------------------
@router.get("/history/purchases")
def my_purchase_history(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = text("""
        SELECT
          pu.id,
          pu.photo_id,
          p.title       AS photo_title,
          pu.total_cost,
          pu.purchase_date
        FROM purchases pu
        JOIN photos p ON pu.photo_id = p.id
        WHERE pu.user_id = :uid
        ORDER BY pu.purchase_date DESC
    """)
    rows = db.execute(stmt, {"uid": current_user_id}).fetchall()
    return [
        {
            "id": r.id,
            "photo_id": r.photo_id,
            "photo_title": r.photo_title,
            "total_cost": float(r.total_cost),
            "purchase_date": r.purchase_date.isoformat(),
        }
        for r in rows
    ]

@router.get("/history/sales")
def my_sales_history(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = text("""
        SELECT
          pu.id,
          pu.photo_id,
          p.title       AS photo_title,
          p.price       AS price,
          pu.purchase_date
        FROM purchases pu
        JOIN photos p ON pu.photo_id = p.id
        WHERE p.owner_id = :uid
        ORDER BY pu.purchase_date DESC
    """)
    rows = db.execute(stmt, {"uid": current_user_id}).fetchall()
    return [
        {
            "id": r.id,
            "photo_id": r.photo_id,
            "photo_title": r.photo_title,
            "price": float(r.price),
            "purchase_date": r.purchase_date.isoformat(),
        }
        for r in rows
    ]



@router.get("/stats/purchases")
def purchase_stats(db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    result = db.execute(text("SELECT get_purchase_stats()")).scalar()
    import json
    return json.loads(result)

@router.get("/stats/misc")
def misc_stats(db: Session = Depends(get_db), admin_user: models.User = Depends(check_admin)):
    result = db.execute(text("SELECT get_misc_stats()")).scalar()
    import json
    return json.loads(result)


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
    """
    Atomowa transakcja: zmiana hasła + usunięcie kodu aktywacyjnego
    za pomocą surowego zapytania SQL.
    """
    # 1) Zahashuj nowe hasło
    new_hash = pwd_context.hash(data.new_password)

    try:
        # 2) Wykonaj raw query w ramach jednej transakcji
        with db.begin():
            stmt = text("""
                UPDATE users
                   SET hashed_password = :new_hash,
                       activation_code = NULL
                 WHERE email = :email
                   AND activation_code = :code
            """)
            result = db.execute(stmt, {
                "new_hash": new_hash,
                "email": data.email,
                "code": data.code,
            })
            # 3) Jeżeli nic nie zaktualizowano, kod lub email są nieprawidłowe
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=400,
                    detail="Nieprawidłowy kod resetujący lub e-mail."
                )
        # commit nastąpi automatycznie przy wyjściu z with db.begin()
    except HTTPException:
        # Przepuśćmy HTTPException dalej, żeby FastAPI zwróciło odpowiedni status
        raise
    except Exception as e:
        # W razie innego błędu zwróćmy 500 i rollback
        raise HTTPException(
            status_code=500,
            detail=f"Błąd aktualizacji hasła: {e}"
        )

    # 4) Zwróć komunikat sukcesu
    return {"message": "Hasło zostało zaktualizowane."}

# ----------------------------- USUWANIE UŻYTKOWNIKA -----------------------------
def delete_user_files(db: Session, user_id: int):
    photos = db.query(models.Photo).filter(models.Photo.owner_id == user_id).all()
    for photo in photos:
        for file_path in [photo.file_path, photo.thumb_path]:
            if file_path:
                p = Path(file_path)
                if p.exists():
                    try:
                        p.unlink()
                    except Exception as e:
                        print(f"Błąd usuwania pliku {p}: {e}")

@router.delete("/users/delete/{user_id}", status_code=204)
def delete_user_full(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    current_user = db.query(models.User).filter(models.User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Błędny użytkownik")

    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień")

    delete_user_files(db, user_id)

    db.execute(text("CALL delete_user_and_related(:uid)"), {"uid": user_id})
    db.commit()

    return {"detail": "Konto i dane użytkownika zostały usunięte"}


@router.get("/stats/sales")
def user_sales_stats(current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = text("""
        SELECT
          (SELECT COUNT(*) FROM photos WHERE owner_id = :uid) AS photos_uploaded,
          (SELECT COUNT(*) FROM purchases pu JOIN photos p ON pu.photo_id = p.id WHERE p.owner_id = :uid) AS photos_sold,
          (SELECT ROUND(SUM(p.price),2) FROM purchases pu JOIN photos p ON pu.photo_id = p.id WHERE p.owner_id = :uid) AS revenue_earned,
          (SELECT ROUND(AVG(p.price),2) FROM purchases pu JOIN photos p ON pu.photo_id = p.id WHERE p.owner_id = :uid) AS avg_price_sold
    """)
    result = db.execute(stmt, {"uid": current_user_id}).one()
    return {
        "photos_uploaded": result.photos_uploaded,
        "photos_sold": result.photos_sold,
        "revenue_earned": result.revenue_earned or 0,
        "avg_price_sold": result.avg_price_sold or 0,
    }
