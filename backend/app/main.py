# app/main.py
from fastapi import FastAPI
from app.database import engine, Base
from app.routers import users, photos
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users, photos
# Import bazy i modeli (jeśli potrzebne do tworzenia tabel)
from app.database import Base, engine

# Tworzymy tabele w bazie, jeśli nie istnieją
Base.metadata.create_all(bind=engine)


app = FastAPI(title="FotoBank", version="1.0.0")

origins = [
    "http://localhost:3000",  # lub inne adresy
    # "http://127.0.0.1:3000",
    # można też dać "*" (ale w produkcji lepiej ograniczyć do konkretnych hostów)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # pozwól na GET, POST, PUT, DELETE, OPTIONS...
    allow_headers=["*"],  # lub wymień konkretne, np. ["Content-Type", "Authorization"]
)

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(photos.router, prefix="/photos", tags=["Photos"])

@app.get("/")
def root():
    return {"message": "Witaj w FotoBank API!"}
