from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import engine, Base
from app.routers import users, photos, users, cart
from app.routers.upload_router import router as upload_router   # ← DODAJ
from fastapi.staticfiles import StaticFiles
from pathlib import Path
Base.metadata.create_all(bind=engine)

app = FastAPI()

MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(exist_ok=True) 

# ─── ROUTERS ──────────────────────────────────────────────
app.include_router(users.router,   prefix="/users",  tags=["Users"])

# ↘ jeśli w photos.router jest już  prefix="/photos",
#   to nie podajemy go drugi raz:
app.include_router(photos.router,  tags=["Photos"])
app.include_router(users.router)
app.include_router(cart.router, prefix="/cart", tags=["Cart"])

# ↘  upload_router też ma prefix="/photos" w definicji


# ──────────────────────────────────────────────────────────

# CORS
# CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
def root():
    return {"message": "Witaj w FotoBank API!"}
app.mount("/media", StaticFiles(directory="media"), name="media")