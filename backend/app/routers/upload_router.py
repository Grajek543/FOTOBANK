# app/routers/upload_router.py
from pathlib import Path
import shutil, uuid, mimetypes
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException,
    Header,
)
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.utils.thumbnails import create_image_thumb, create_video_thumb

CHUNK = 1024 * 1024     # 1 MB

def file_iterator(path: Path, start: int, end: int, chunk_size: int = CHUNK):
    """Zwraca kolejne kawałki pliku w zakresie <start, end> (oba włącznie)"""
    with path.open("rb") as f:
        f.seek(start)
        bytes_to_send = (end - start) + 1
        while bytes_to_send > 0:
            chunk = f.read(min(chunk_size, bytes_to_send))
            if not chunk:
                break
            bytes_to_send -= len(chunk)
            yield chunk

# ─────────────────────────── konfiguracja ───────────────────────────
MEDIA_DIR   = Path("media")          # ./backend/media
THUMB_DIR   = MEDIA_DIR / "thumbs"
CHUNK_SIZE  = 1024 * 1024           # 1 MB

for d in (MEDIA_DIR, THUMB_DIR):
    d.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/photos", tags=["photos"])

# ───────────────────────────── upload ──────────────────────────────
@router.post("/upload", response_model=schemas.PhotoOut)
async def upload_photo(
    title:        str           = Form(...),
    description:  str           = Form(""),
    category:     str           = Form(""),
    price:        float         = Form(0.0),
    file:         UploadFile    = File(...),
    db:           Session       = Depends(get_db),
    # current_user: models.User = Depends(get_current_user)
):
    # → 1. Walidacja typu
    ALLOWED = {".jpg", ".jpeg", ".png", ".mp4", ".mov"}
    suffix  = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED:
        raise HTTPException(400, "Niedozwolony format pliku")

    # → 2. Zapisywanie na dysk
    uid        = uuid.uuid4().hex
    file_path  = MEDIA_DIR / f"{uid}{suffix}"
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # → 3. Generowanie miniatury
    thumb_path: Path | None = None
    if suffix in {".jpg", ".jpeg", ".png"}:
        thumb_path = THUMB_DIR / f"{uid}.jpg"
        create_image_thumb(file_path, thumb_path)
    elif suffix in {".mp4", ".mov"}:
        thumb_path = THUMB_DIR / f"{uid}.jpg"
        create_video_thumb(file_path, thumb_path)

    # → 4. Zapis w bazie
    new_photo = models.Photo(
        title       = title,
        description = description,
        category    = category,
        price       = price,
        file_path   = str(file_path),
        thumb_path  = str(thumb_path) if thumb_path else None,
        owner_id    = 1,                 # current_user.id  ← jeśli masz auth
    )

    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    return new_photo

# ───────────────────── statyczne miniatury / zdjęcia ─────────────────────
router.mount("/media", StaticFiles(directory="media"), name="media")

# ──────────────────────────── streaming wideo ────────────────────────────
@router.get("/stream/{photo_id}")
def stream_video(
    photo_id: int,
    range_header: str | None = Header(default=None, convert_underscores=False, alias="Range"),
    db: Session = Depends(get_db),
):
    """Obsługa HTTP Range + streaming MP4/MOV."""
    photo = db.get(models.Photo, photo_id)
    if not photo:
        raise HTTPException(404)

    path = Path(photo.file_path)
    if not path.exists():
        raise HTTPException(404)

    mime, _ = mimetypes.guess_type(str(path))
    mime = mime or "application/octet-stream"

    file_size = path.stat().st_size
    start, end = 0, file_size - 1

    if range_header:                       # „Range: bytes=…”
        try:
            units, pos = range_header.split("=")
            if units != "bytes":
                raise ValueError
            start_str, end_str = pos.split("-")
            start = int(start_str)
            if end_str:
                end = int(end_str)
        except ValueError:
            raise HTTPException(416, "Invalid range header")

    chunk_length = (end - start) + 1
    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
    }

    def iter_file():
        with path.open("rb") as f:
            f.seek(start)
            remaining = chunk_length
            while remaining > 0:
                data = f.read(min(CHUNK_SIZE, remaining))
                if not data:
                    break
                remaining -= len(data)
                yield data

    return StreamingResponse(
        iter_file(),
        status_code = 206 if range_header else 200,
        media_type  = mime,
        headers     = headers,
    )

# ──────────────────────────── streaming wideo ────────────────────────────
@router.get("/stream/{photo_id}")
def stream_video(
    photo_id: int,
    range: str | None = None,
    db: Session = Depends(get_db),
):
    photo = db.get(models.Photo, photo_id)
    if not photo:
        raise HTTPException(404)

    path = Path(photo.file_path)
    if not path.exists():
        raise HTTPException(404)

    mime, _ = mimetypes.guess_type(str(path))
    mime = mime or "video/mp4"

    file_size = path.stat().st_size
    start, end = 0, file_size - 1

    if range:                          # "bytes=123-"
        units, pos = range.split("=")
        if units != "bytes":
            raise HTTPException(416)
        start_str, end_str = pos.split("-")
        start = int(start_str)
        if end_str:
            end = int(end_str)

    chunk_size = (end - start) + 1
    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Accept-Ranges": "bytes",
    }

    file_like = open(path, "rb")
    file_like.seek(start)

    return StreamingResponse(
        file_like,
        status_code = 206 if range else 200,
        media_type  = mime,
        headers     = headers,
    )
