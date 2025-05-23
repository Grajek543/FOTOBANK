# app/routers/photos.py

from uuid import uuid4
from pathlib import Path
import shutil
import mimetypes
import subprocess
from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form, Query, Body, Request
from fastapi.responses import FileResponse
from starlette.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import or_, func

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
API_BASE = "http://127.0.0.1:8000"

def create_thumbnail(src_path: Path, dst_path: Path) -> None:
    try:
        if src_path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            from PIL import Image
            with Image.open(src_path) as im:
                im.thumbnail((320, 320))
                im.save(dst_path, format="JPEG", quality=85)
        else:
            dst_path = dst_path.with_suffix(".jpg")
            subprocess.run(
                [
                    "ffmpeg", "-i", str(src_path), "-ss", "00:00:01.000",
                    "-vframes", "1", "-vf", "scale=320:-1", str(dst_path)
                ],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
    except Exception as e:
        print(f"Błąd przy generowaniu miniatury: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def build_photo_response(photo: models.Photo) -> schemas.PhotoOut:
    file_name = Path(photo.file_path).name if photo.file_path else ""
    thumb_name = f"{Path(file_name).stem}.jpg" if file_name else None
    category_ids = [c.id for c in photo.categories]

    return schemas.PhotoOut(
        id=photo.id,
        title=photo.title,
        description=photo.description,
        category=",".join([c.name for c in photo.categories]),
        price=photo.price,
        owner_id=photo.owner_id,
        file_url=f"{API_BASE}/media/{file_name}" if file_name else "",
        thumb_url=f"{API_BASE}/media/thumbs/{thumb_name}" if thumb_name else None,
        category_ids=category_ids,
        purchases_number=len(photo.purchases)
    )


router = APIRouter(prefix="/photos", tags=["photos"])

@router.post("/upload", response_model=List[schemas.PhotoOut])
async def upload_photos(
    request: Request,
    titles: List[str] = Form(...),
    descriptions: List[str] = Form(...),
    price: float = Form(...),
    files: List[UploadFile] = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if len(files) != len(titles) or len(files) != len(descriptions):
        raise HTTPException(400, "Liczba tytułów/opisów musi odpowiadać liczbie plików")

    form_data = await request.form()
    output: List[schemas.PhotoOut] = []

    for i, file in enumerate(files):
        if file.content_type not in ALLOWED_TYPES:
            continue

        ext = Path(file.filename).suffix.lower()
        file_name = f"{uuid4().hex}{ext}"
        file_full_path = MEDIA_DIR / file_name

        with file_full_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        thumb_full_path = THUMBS_DIR / f"{file_full_path.stem}.jpg"
        create_thumbnail(file_full_path, thumb_full_path)

        photo = models.Photo(
            title=titles[i],
            description=descriptions[i],
            price=price,
            file_path=str(file_full_path),
            thumb_path=str(thumb_full_path) if thumb_full_path.exists() else None,
            owner_id=user_id,
        )
        db.add(photo)
        db.flush()

        category_ids = form_data.getlist("category_ids")
        for cat_id in category_ids:
            db.add(models.PhotoCategory(photo_id=photo.id, category_id=int(cat_id)))

        output.append(build_photo_response(photo))

    db.commit()
    return output


@router.get("/", response_model=List[schemas.PhotoOut])
def list_photos(
    q: str = Query(default=None),
    category_ids: List[int] = Query(default=None, alias="category_ids"),
    sort_by: str = Query(default=None),
    price_min: float = Query(default=None),
    price_max: float = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Photo)

    if category_ids:
        for i, cat_id in enumerate(category_ids):
            alias = aliased(models.PhotoCategory, name=f"pc_{i}")
            query = query.join(alias, alias.photo_id == models.Photo.id)
            query = query.filter(alias.category_id == cat_id)
    elif q:
        query = query.filter(
            or_(
                models.Photo.title.ilike(f"%{q}%"),
                models.Photo.description.ilike(f"%{q}%")
            )
        )

    if price_min is not None:
        query = query.filter(models.Photo.price >= price_min)
    if price_max is not None:
        query = query.filter(models.Photo.price <= price_max)

    if sort_by == "popular":
        query = query.outerjoin(models.Purchase).group_by(models.Photo.id).order_by(func.count(models.Purchase.id).desc())
    elif sort_by == "price_asc":
        query = query.order_by(models.Photo.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(models.Photo.price.desc())
    elif sort_by == "date_new":
        query = query.order_by(models.Photo.created_at.desc())

    photos = query.options(
        joinedload(models.Photo.categories),
        joinedload(models.Photo.purchases)
    ).all()
    return [build_photo_response(p) for p in photos]

@router.get("/me", response_model=List[schemas.PhotoOut])
def get_my_photos(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    photos = db.query(models.Photo).filter(models.Photo.owner_id == user_id).all()
    return [build_photo_response(p) for p in photos]

@router.get("/categories", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

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

@router.put("/{photo_id}", response_model=schemas.PhotoOut)
def update_photo(
    photo_id: int,
    photo_data: schemas.PhotoUpdate = Body(...),
    category_ids: List[int] = Body(default=[]),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id, models.Photo.owner_id == user_id).first()
    if not photo:
        raise HTTPException(404, "Zdjęcie nie znalezione lub brak dostępu")

    if photo_data.title is not None:
        photo.title = photo_data.title
    if photo_data.description is not None:
        photo.description = photo_data.description
    if photo_data.price is not None:
        photo.price = photo_data.price


    db.query(models.PhotoCategory).filter(models.PhotoCategory.photo_id == photo.id).delete()
    for cat_id in category_ids:
        db.add(models.PhotoCategory(photo_id=photo.id, category_id=cat_id))

    db.commit()
    db.refresh(photo)
    return build_photo_response(photo)

@router.get("/{photo_id}")
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(models.Photo).options(joinedload(models.Photo.categories), joinedload(models.Photo.owner)).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Zdjęcie nie znalezione")

    category_names = [cat.name for cat in photo.categories] if photo.categories else []

    return {
        "id": photo.id,
        "title": photo.title,
        "description": photo.description,
        "categories": category_names,
        "price": photo.price,
        "owner_id": photo.owner_id,
        "owner_username": photo.owner.username if photo.owner else "Brak",
        "file_url": photo.file_path,
        "thumb_url": photo.thumb_path,
    }

router.mount("/media", StaticFiles(directory="media"), name="media")