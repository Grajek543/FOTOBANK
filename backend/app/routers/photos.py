# app/routers/photos.py
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Photo, User
from app.schemas import PhotoCreate, PhotoRead
from app.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter()

class PhotoUpdate(BaseModel):
    title: str
    description: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload", response_model=PhotoRead)
async def upload_photo(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Nieobsługiwany format. Dozwolone: JPEG, PNG.")

    file_data = await file.read()

    photo = Photo(
        title=title,
        description=description,
        category=category,
        price=price,
        file_data=file_data,
        owner_id=user_id
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return {
        "id": photo.id,
        "title": photo.title,
        "description": photo.description,
        "category": photo.category,
        "price": photo.price,
        "owner_id": photo.owner_id,
        "owner_username": photo.owner.username if photo.owner else "Brak"
    }


@router.get("/", response_model=list[PhotoRead])
def list_photos(db: Session = Depends(get_db)):
    photos = db.query(Photo).all()
    return [
        {
            "id": photo.id,
            "title": photo.title,
            "description": photo.description,
            "category": photo.category,
            "price": photo.price,
            "owner_id": photo.owner_id,
            "owner_username": photo.owner.username if photo.owner else "Brak"
        }
        for photo in photos
    ]


@router.get("/me", response_model=list[PhotoRead])
def get_my_photos(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    photos = db.query(Photo).filter(Photo.owner_id == user_id).all()
    return [
        {
            "id": photo.id,
            "title": photo.title,
            "description": photo.description,
            "category": photo.category,
            "price": photo.price,
            "owner_id": photo.owner_id,
            "owner_username": photo.owner.username if photo.owner else "Brak"
        }
        for photo in photos
    ]


@router.get("/{photo_id}/file")
def get_photo_file(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo or not photo.file_data:
        raise HTTPException(status_code=404, detail="Plik nie znaleziony")

    return Response(content=photo.file_data, media_type="image/jpeg")

@router.delete("/{photo_id}", status_code=204)
def delete_photo(photo_id: int, user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id, Photo.owner_id == user_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Zdjęcie nie znalezione lub brak dostępu")
    db.delete(photo)
    db.commit()


@router.put("/{photo_id}", status_code=200)
def update_photo(
    photo_id: int,
    photo_data: PhotoUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    photo = db.query(Photo).filter(Photo.id == photo_id, Photo.owner_id == user_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Zdjęcie nie znalezione lub brak dostępu")

    photo.title = photo_data.title
    photo.description = photo_data.description
    db.commit()
    db.refresh(photo)

    return {"message": "Zdjęcie zaktualizowane"}

@router.get("/{photo_id}", response_model=PhotoRead)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Zdjęcie nie znalezione")
     
    return {
        "id": photo.id,
        "title": photo.title,
        "description": photo.description,
        "category": photo.category,
        "price": photo.price,
        "owner_id": photo.owner_id,
        "owner_username": photo.owner.username if photo.owner else "Brak"
    }