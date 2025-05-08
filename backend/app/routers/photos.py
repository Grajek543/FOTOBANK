from uuid import uuid4
from pathlib import Path
import shutil
import mimetypes
import subprocess

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
from starlette.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.dependencies import get_current_user
from app import models, schemas
from app.utils.thumbnails import create_video_thumb, create_image_thumb

MEDIA_DIR: Path = Path("media")
THUMBS_DIR: Path = MEDIA_DIR / "thumbs"
MEDIA_DIR.mkdir(exist_ok=True)
THUMBS_DIR.mkdir(exist_ok=True)

IMAGE_TYPES = {"image/jpeg", "image/png"}
VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-matroska"}
ALLOWED_TYPES: set[str] = IMAGE_TYPES | VIDEO_TYPES

def create_thumbnail(src_path: Path, dst_path: Path) -> None:
    try:
        if src_path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            from PIL import Image
            with Image.open(src_path) as im:
                im.thumbnail((320, 320))
                im.save(dst_path, format="JPEG", quality=85)
        else:
            subprocess.run(
                ["ffmpeg", "-i", str(src_path), "-ss", "00:00:01.000", "-vframes", "1", str(dst_path)],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False
            )
    except Exception:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def build_photo_response(photo: models.Photo) -> dict:
    return {
        "id": photo.id,
        "title": photo.title,
        "description": photo.description,
        "category": photo.category,
        "price": photo.price,
        "file_url": f"/media/{Path(photo.file_path).name}".replace("\\", "/"),
        "thumb_url": (
            f"/media/{Path(photo.thumb_path).name}".replace("\\", "/") if photo.thumb_path else None
        ),
        "owner_id": photo.owner_id,
    }

router = APIRouter(prefix="/photos", tags=["photos"])

@router.post("/upload")
async def upload_photo(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Niedozwolony typ pliku")

    ext = Path(file.filename).suffix.lower()
    file_name = f"{uuid4().hex}{ext}"
    file_full_path = MEDIA_DIR / file_name

    with file_full_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    thumb_full_path = THUMBS_DIR / f"{file_full_path.stem}.jpg"
    create_thumbnail(file_full_path, thumb_full_path)

    photo = models.Photo(
        title=title,
        description=description,
        category=category,
        price=price,
        file_path=str(file_full_path),
        thumb_path=str(thumb_full_path) if thumb_full_path.exists() else None,
        owner_id=user_id,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return build_photo_response(photo)

@router.get("/")
def list_photos(db: Session = Depends(get_db)):
    photos = db.query(models.Photo).all()
    return [build_photo_response(p) for p in photos]

@router.get("/me")
def get_my_photos(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    photos = db.query(models.Photo).filter(models.Photo.owner_id == user_id).all()
    return [build_photo_response(p) for p in photos]

@router.get("/{photo_id}/file")
def get_file(photo_id: int, db: Session = Depends(get_db)):
    photo = db.get(models.Photo, photo_id)
    if not photo or not photo.file_path:
        raise HTTPException(404, "Plik nie istnieje")

    path = Path(photo.file_path)
    if not path.exists():
        raise HTTPException(404, "Plik nie znaleziony na dysku")

    media_type, _ = mimetypes.guess_type(str(path))
    return FileResponse(path, media_type=media_type)

@router.delete("/{photo_id}", status_code=204)
def delete_photo(photo_id: int, user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id, models.Photo.owner_id == user_id).first()
    if not photo:
        raise HTTPException(404, "Zdjęcie nie znalezione lub brak dostępu")

    for _p in (photo.file_path, photo.thumb_path):
        if _p and Path(_p).exists():
            Path(_p).unlink(missing_ok=True)

    db.delete(photo)
    db.commit()

@router.put("/{photo_id}")
def update_photo(
    photo_id: int,
    photo_data: schemas.PhotoUpdate,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id, models.Photo.owner_id == user_id).first()
    if not photo:
        raise HTTPException(404, "Zdjęcie nie znalezione lub brak dostępu")

    photo.title = photo_data.title
    photo.description = photo_data.description
    db.commit()
    db.refresh(photo)
    return build_photo_response(photo)

@router.get("/{photo_id}")
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(404, "Zdjęcie nie znalezione")
    return build_photo_response(photo)

router.mount("/media", StaticFiles(directory="media"), name="media")
