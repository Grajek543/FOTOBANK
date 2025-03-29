# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app import schemas, models
from app.database import SessionLocal

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
    # Sprawdź, czy email już istnieje
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Użytkownik z takim e-mailem już istnieje.")

    hashed_password = pwd_context.hash(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Nieprawidłowy login lub hasło.")

    # Weryfikacja hasła
    if not pwd_context.verify(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Nieprawidłowy login lub hasło.")

    return {"message": "Zalogowano pomyślnie", "user_id": user.id, "role": user.role}

@router.put("/update", response_model=schemas.UserRead)
def update_user(user_update: schemas.UserUpdate, user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Zamiast: hashed_username = pwd_context.hash(user_update.username)
    # przypisujemy nową nazwę użytkownika bez hashowania:
    user.username = user_update.username

    db.commit()
    db.refresh(user)
    return user


