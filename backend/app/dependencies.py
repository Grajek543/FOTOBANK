

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.security import verify_token
from app.database import SessionLocal
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")
"""
Ta linijka oznacza, że FastAPI spodziewa się w nagłówku:
Authorization: Bearer <token>
"""

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Zwraca ID zalogowanego użytkownika (z payloadu tokena)."""
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy token lub token wygasł",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token nie zawiera sub (user_id)"
        )
    return int(user_id)

def check_admin(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sprawdza, czy zalogowany użytkownik ma rolę 'admin'."""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień (tylko administrator)."
        )
    return user

def ensure_not_banned(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user_id).first()
    if user and user.banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Konto jest zablokowane"
        )
    return user.id
