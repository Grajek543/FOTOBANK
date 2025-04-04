# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")
"""
Ta linijka oznacza, że FastAPI spodziewa się w nagłówku:
Authorization: Bearer <token>
"""

def get_current_user(token: str = Depends(oauth2_scheme)):
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
    return user_id
