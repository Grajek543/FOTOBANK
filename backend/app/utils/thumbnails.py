# app/utils/thumbnails.py
from pathlib import Path
from PIL import Image               # pillow
import subprocess                   # ffmpeg do wideo

THUMB_SIZE = (400, 400)             # możesz zmienić

# ─────────────────────────────────────────────
# 1️⃣  miniatura zdjęcia
# ─────────────────────────────────────────────
def create_image_thumb(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(src) as img:
        img.thumbnail(THUMB_SIZE)
        img.convert("RGB").save(dst, "JPEG", quality=85)

# ─────────────────────────────────────────────
# 2️⃣  miniatura wideo  (ffmpeg – 1‑szy kadr)
# ─────────────────────────────────────────────
def create_video_thumb(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)

    # -ss 00:00:01  → kadr 1 sek
    # -vframes 1    → jedna klatka
    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(src),
        "-ss", "00:00:01",
        "-vframes", "1",
        "-vf", f"scale={THUMB_SIZE[0]}:{THUMB_SIZE[1]}:force_original_aspect_ratio=decrease",
        str(dst)
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        # ffmpeg nie zainstalowany – zostaw pustą miniaturę
        pass
