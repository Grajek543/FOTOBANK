import os, uuid, shutil, subprocess
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import Media
from app.dependencies import get_current_user

router = APIRouter()
TEMP_DIR = "/tmp/fotobank_chunks"
os.makedirs(TEMP_DIR, exist_ok=True)

class InitResponse(BaseModel):
    upload_id: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/init", response_model=InitResponse)
def init_upload(user_id: int = Depends(get_current_user)):
    return {"upload_id": str(uuid.uuid4())}

@router.post("/upload-chunk")
async def upload_chunk(
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    media_type: Optional[str] = Form(None),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_path = os.path.join(TEMP_DIR, upload_id)
    os.makedirs(upload_path, exist_ok=True)
    chunk_path = os.path.join(upload_path, f"{chunk_index:05d}.part")
    with open(chunk_path, "wb") as f:
        f.write(await file.read())

    received = len([c for c in os.listdir(upload_path) if c.endswith(".part")])
    if received != total_chunks:
        return {"status": "partial", "received": received}

    order = [i for i in range(1, total_chunks + 1, 2)] + [i for i in range(2, total_chunks + 1, 2)]
    merged = bytearray()
    for idx in order:
        with open(os.path.join(upload_path, f"{idx:05d}.part"), "rb") as f:
            merged += f.read()

    tmp_full = os.path.join(upload_path, "full.bin")
    with open(tmp_full, "wb") as f:
        f.write(merged)

    os.makedirs("media", exist_ok=True)
    thumb_path = os.path.join("media", f"{uuid.uuid4()}_thumb.jpg")
    preview_path = os.path.join("media", f"{uuid.uuid4()}_preview.jpg")

    if media_type == "image":
        subprocess.run(["convert", tmp_full, "-resize", "200x200", thumb_path], check=True)
        subprocess.run(["convert", tmp_full, "-resize", "800x800", preview_path], check=True)
    elif media_type == "video":
        subprocess.run(["ffmpeg", "-i", tmp_full, "-ss", "00:00:01.000", "-vframes", "1", thumb_path], check=True)
        preview_path = preview_path.replace(".jpg", ".mp4")
        subprocess.run(["ffmpeg", "-i", tmp_full, "-t", "10", "-c:v", "libx264", "-an", preview_path], check=True)
    else:
        raise HTTPException(status_code=400, detail="media_type must be image or video")

    media = Media(
        title=title or "",
        description=description or "",
        category=category or "",
        price=price or 0,
        media_type=media_type,
        file_data=bytes(merged),
        thumb_path=thumb_path,
        preview_path=preview_path,
        owner_id=user_id,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    shutil.rmtree(upload_path, ignore_errors=True)
    return {"status": "complete", "media_id": media.id}

@router.get("/{media_id}/thumb")
def get_thumb(media_id: int, db: Session = Depends(get_db)):
    m = db.query(Media).get(media_id)
    if not m:
        raise HTTPException(404)
    return FileResponse(m.thumb_path)

@router.get("/{media_id}/preview")
def get_preview(media_id: int, db: Session = Depends(get_db)):
    m = db.query(Media).get(media_id)
    if not m:
        raise HTTPException(404)
    return FileResponse(m.preview_path)

@router.get("/{media_id}/file")
def get_full(media_id: int, db: Session = Depends(get_db)):
    m = db.query(Media).get(media_id)
    if not m:
        raise HTTPException(404)
    media_type = "video/mp4" if m.media_type == "video" else "image/jpeg"
    return Response(content=m.file_data, media_type=media_type)
