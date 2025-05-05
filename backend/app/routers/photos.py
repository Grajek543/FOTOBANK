# app/routers/photos.py – rozszerzona wersja z obsługą wideo i miniatur

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
from app.dependencies import get_current_user  # ⇦ zwraca ID użytkownika (int)
from app import models, schemas
from app.utils.thumbnails import create_video_thumb, create_image_thumb

# ---------------------------------------------------------------------------
# Stałe / katalogi
# ---------------------------------------------------------------------------
MEDIA_DIR: Path = Path("media")
THUMBS_DIR: Path = MEDIA_DIR / "thumbs"
MEDIA_DIR.mkdir(exist_ok=True)
THUMBS_DIR.mkdir(exist_ok=True)

IMAGE_TYPES = {"image/jpeg", "image/png"}
VIDEO_TYPES = {
    "video/mp4",
    "video/quicktime",  # mov
    "video/x-matroska",  # mkv
}
ALLOWED_TYPES: set[str] = IMAGE_TYPES | VIDEO_TYPES

# ---------------------------------------------------------------------------
# Pomocnicze
# ---------------------------------------------------------------------------

def create_thumbnail(src_path: Path, dst_path: Path) -> None:
    """Tworzy miniaturę JPG.

    * Dla zdjęć – Pillow.
    * Dla wideo – ffmpeg (pierwsza klatka w ~ 1 s)."""

    try:
        if src_path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            from PIL import Image  # pillow

            with Image.open(src_path) as im:
                im.thumbnail((320, 320))
                im.save(dst_path, format="JPEG", quality=85)
        else:  # wideo
            # wymaga ffmpeg w PATH – wyciągamy 1. klatkę po 1 sekundzie
            subprocess.run(
                [
                    "ffmpeg",
                    "-i",
                    str(src_path),
                    "-ss",
                    "00:00:01.000",
                    "-vframes",
                    "1",
                    str(dst_path),
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
    except Exception:
        # ignorujemy błędy – miniatura opcjonalna
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/photos", tags=["photos"])

# ----------------------------------------
# UPLOAD
# ----------------------------------------
@router.post("/upload", response_model=schemas.PhotoOut)
async def upload_photo(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),  # ⇦ ID użyt.
    db: Session = Depends(get_db),
):
    # 1️⃣ walidacja typu MIME
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Niedozwolony typ pliku")

    # 2️⃣ nazwa i pełna ścieżka pliku
    ext = Path(file.filename).suffix.lower()
    file_name = f"{uuid4().hex}{ext}"
    file_full_path = MEDIA_DIR / file_name

    # 3️⃣ zapis
    with file_full_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4️⃣ miniatura (tylko jeśli możemy ją wygenerować)
    thumb_full_path = THUMBS_DIR / f"{file_full_path.stem}.jpg"
    create_thumbnail(file_full_path, thumb_full_path)

    # 5️⃣ rekord w bazie
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

    return photo  # → zgodne ze schemas.PhotoOut

# ----------------------------------------
# LISTA WSZYSTKICH
# ----------------------------------------
@router.get("/", response_model=list[schemas.PhotoOut])
def list_photos(db: Session = Depends(get_db)):
    return db.query(models.Photo).all()

# ----------------------------------------
# MOJE ZDJĘCIA / FILMY
# ----------------------------------------
@router.get("/me", response_model=list[schemas.PhotoOut])
def get_my_photos(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Photo).filter(models.Photo.owner_id == user_id).all()

# ----------------------------------------
# POJEDYNCZY PLIK
# ----------------------------------------
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

# ----------------------------------------
# DELETE / PUT / GET (detale)
# ----------------------------------------
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


@router.put("/{photo_id}", response_model=schemas.PhotoOut)
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
    return photo


@router.get("/{photo_id}", response_model=schemas.PhotoOut)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(404, "Zdjęcie nie znalezione")
    return photo

# ---------------------------------------------------------------------------
# Statyczne
# ---------------------------------------------------------------------------
router.mount("/media", StaticFiles(directory="media"), name="media")
