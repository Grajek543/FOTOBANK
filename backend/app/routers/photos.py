# app/routers/photos.py
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
import shutil, os
import requests  # jeśli Sam2 to zewnętrzne API

from app.database import SessionLocal
from app.models import Photo, User
from app.schemas import PhotoCreate, PhotoRead

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

SAM2_ENDPOINT = "http://sam2.example.com/analyze"  # przykładowe

@router.post("/upload", response_model=PhotoRead)
def upload_photo(
    title: str,
    description: str,
    category: str,
    price: float,
    file: UploadFile = File(...),
    user_id: int = 1,  # w praktyce - z tokena/logowania
    db: Session = Depends(get_db)
):
    # Walidacja formatu
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Nieobsługiwany format. Dozwolone: JPEG, PNG.")

    # Zapis pliku (np. do folderu 'uploads')
    UPLOAD_DIR = "uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Wywołanie Sam2 (analiza AI) - np. wysyłamy ścieżkę lub plik
    # Tu przykładowo wysyłamy plik w formie multipart do Sam2:
    # data = {"some_param": "value"}
    # files = {"file": open(file_path, "rb")}
    # response = requests.post(SAM2_ENDPOINT, data=data, files=files)
    #
    # if response.status_code == 200:
    #     ai_data = response.json()   # np. kategoria, tagi
    #     category = ai_data.get("category", category)  # jeżeli chcemy nadpisać
    # else:
    #     ...

    # Zapis w bazie
    photo = Photo(
        title=title,
        description=description,
        category=category,
        price=price,
        file_path=file_path,
        owner_id=user_id
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return photo
