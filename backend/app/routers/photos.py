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
from sqlalchemy import or_, func, and_, text

from app.schemas import PhotoOut
from app.models import UploadSession, Photo, User
from app.database import SessionLocal, get_db
from app.dependencies import get_current_user, check_admin
from app import models, schemas
from app.utils.thumbnails import create_video_thumb, create_image_thumb
from app.dependencies import check_admin
from typing import List


from sqlalchemy.orm import Session

MEDIA_DIR: Path = Path("media")
THUMBS_DIR: Path = MEDIA_DIR / "thumbs"
MEDIA_DIR.mkdir(exist_ok=True)
THUMBS_DIR.mkdir(exist_ok=True)

IMAGE_TYPES = {"image/jpeg", "image/png"}
VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-matroska"}
ALLOWED_TYPES: set[str] = IMAGE_TYPES | VIDEO_TYPES
API_BASE = "http://127.0.0.1:8000"
router = APIRouter()

def create_thumbnail(src_path: Path, dst_path: Path) -> None:
    try:
        if src_path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            from PIL import Image
            with Image.open(src_path) as im:
                # Konwersja do RGB (usuwa kanał alfa, jeśli jest)
                if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
                    im = im.convert("RGB")

                im.thumbnail((320, 320))
                im.save(dst_path, format="JPEG", quality=85)
        else:
            # ... (pozostała obsługa wideo)
            import subprocess
            # (np. komenda ffmpeg)
            command = [
                "ffmpeg",
                "-i",
                str(src_path),
                "-vf",
                "thumbnail,scale=320:-1",
                "-frames:v",
                "1",
                str(dst_path),
            ]
            subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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

def add_photo_via_proc(db: Session, title, description, category, price, file_path, thumb_path, owner_id) -> int:
    raw_conn = db.connection().connection
    cursor = raw_conn.cursor()
    cursor.callproc('add_photo', [title, description, category, price, file_path, thumb_path, owner_id])
    while cursor.nextset():
        pass
    cursor.execute("SELECT LAST_INSERT_ID()")
    last_id = cursor.fetchone()[0]
    cursor.close()
    return last_id






router = APIRouter(prefix="/photos", tags=["photos"])

@router.get("/user/{user_id}", response_model=List[schemas.PhotoOut])
def get_user_photos(
    user_id: int,
    admin_user: User = Depends(check_admin),
    db: Session = Depends(get_db),
):
    rows = db.execute(text("SELECT * FROM photos WHERE owner_id = :uid"), {"uid": user_id}).mappings().all()
    return [build_photo_response(Photo(**r)) for r in rows]


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

        photo_id = add_photo_via_proc(
            db,
            title,
            description,
            category,
            price,
            str(file_path),
            str(thumb_path) if thumb_path else None,
            user_id
        )


        category_ids = form_data.getlist("category_ids")
        for cat_id in category_ids:
            db.add(models.PhotoCategory(photo_id=photo_id, category_id=int(cat_id)))

        db.commit()

        photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
        output.append(build_photo_response(photo))

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
    rows = db.execute(text("SELECT * FROM photos WHERE owner_id = :uid"), {"uid": user_id}).mappings().all()
    return [build_photo_response(Photo(**r)) for r in rows]


@router.get("/categories", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT id, name FROM categories")).mappings().all()
    return [{"id": r["id"], "name": r["name"]} for r in rows]


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
def delete_photo(
    photo_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user),
    admin_user: User = Depends(check_admin),
):
    # Pobierz zdjęcie bez warunku na owner_id
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Zdjęcie nie znalezione")  # not found

    # tylko właściciel lub admin
    if photo.owner_id != current_user_id and admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Brak dostępu")  # forbidden

    # usuń pliki z dysku
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
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user),
    admin_user: User = Depends(check_admin),
):
    # Pobierz zdjęcie bez warunku na owner_id
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Zdjęcie nie znalezione")

    # tylko właściciel lub admin
    if photo.owner_id != current_user_id and admin_user.role != "admin":
        raise HTTPException(status_code=403, detail="Brak dostępu")

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


@router.get("/purchased", response_model=List[schemas.PhotoOut])
def get_purchased_photos(user=Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = text("""
        SELECT p.* FROM photos p
        JOIN purchases pu ON p.id = pu.photo_id
        WHERE pu.user_id = :uid
    """)
    rows = db.execute(stmt, {"uid": user}).mappings().all()
    return [build_photo_response(Photo(**r)) for r in rows]


@router.get("/download/{photo_id}")
def download_photo(
    photo_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stmt = text("""
        SELECT p.* FROM photos p
        JOIN purchases pu ON p.id = pu.photo_id
        WHERE pu.user_id = :uid AND p.id = :photo_id
    """)
    row = db.execute(stmt, {"uid": user_id, "photo_id": photo_id}).mappings().first()


    if not photo or not photo.file_path:
        raise HTTPException(status_code=404, detail="Nie znaleziono pliku lub brak dostępu")

    file_path = Path(photo.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Plik nie istnieje na dysku")

    media_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(path=file_path, media_type=media_type, filename=file_path.name)


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


#UPLOAD
@router.post("/start-upload")
def start_upload(total_chunks: int = Form(...), db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    upload_id = str(uuid4())
    session = UploadSession(
        upload_id=upload_id,
        user_id=user_id,
        total_chunks=total_chunks,
        received_chunks=0
    )
    db.add(session)
    db.commit()
    return {"upload_id": upload_id}

upload_buffers = {} 

@router.post("/upload-chunk")
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    session = db.query(UploadSession).filter(and_(UploadSession.upload_id == upload_id, UploadSession.user_id == user_id)).first()
    if not session:
        raise HTTPException(status_code=404, detail="Upload session not found")

    content = await chunk.read()
    if upload_id not in upload_buffers:
        upload_buffers[upload_id] = {}
    upload_buffers[upload_id][chunk_index] = content
    session.received_chunks = len(upload_buffers[upload_id])
    db.commit()

    return {"message": f"Received chunk {chunk_index}"}

@router.post("/finish-upload", response_model=schemas.PhotoOut)
def finish_upload(
    upload_id: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    category_ids: List[int] = Form(default=[]),
    original_filename: str = Form(...),  # dodane pole do przesłania oryginalnej nazwy pliku
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    session = db.query(UploadSession).filter(
        (UploadSession.upload_id == upload_id) & (UploadSession.user_id == user_id)
    ).first()
    if not session or session.is_finished:
        raise HTTPException(status_code=404, detail="Upload session invalid or already completed")

    chunks_dict = upload_buffers.get(upload_id)
    if not chunks_dict or len(chunks_dict) != session.total_chunks:
        raise HTTPException(status_code=400, detail="Not all chunks received")

    ordered = [chunks_dict[i] for i in sorted(chunks_dict.keys())]
    final_data = b''.join(ordered)

    ext = Path(original_filename).suffix.lower()
    ALLOWED = {".jpg", ".jpeg", ".png", ".mp4", ".mov"}
    if ext not in ALLOWED:
        ext = ".bin"

    file_name = f"{uuid4().hex}{ext}"
    file_path = MEDIA_DIR / file_name

    with file_path.open("wb") as f:
        f.write(final_data)

    thumb_path = THUMBS_DIR / f"{file_path.stem}.jpg"
    create_thumbnail(file_path, thumb_path)

    photo_id = add_photo_via_proc(
        db,
        title,
        description,
        category,
        price,
        str(file_path),
        str(thumb_path) if thumb_path.exists() else None,
        user_id
    )

    for cat_id in category_ids:
        db.add(models.PhotoCategory(photo_id=photo_id, category_id=cat_id))

    db.delete(session)
    db.commit()

    if upload_id in upload_buffers:
        del upload_buffers[upload_id]

    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    return build_photo_response(photo)




@router.post("/{photo_id}/set-categories")
def set_photo_categories(
    photo_id: int,
    category_ids: List[int] = Body(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id, models.Photo.owner_id == user_id).first()
    if not photo:
        raise HTTPException(404, "Zdjęcie nie znalezione lub brak dostępu")

    db.query(models.PhotoCategory).filter(models.PhotoCategory.photo_id == photo_id).delete()
    for cat_id in category_ids:
        db.add(models.PhotoCategory(photo_id=photo_id, category_id=cat_id))

    db.commit()
    return {"message": "Kategorie zaktualizowane"}


@router.get("/me/count")
def get_my_photo_count(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.execute(text("SELECT get_total_user_photos(:uid) AS total"), {"uid": user_id})
    count = result.scalar()
    return {"total_photos": count}
