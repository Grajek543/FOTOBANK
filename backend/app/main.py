from fastapi import FastAPI
from app.database import engine, Base
from app.routers import users, photos
from fastapi.middleware.cors import CORSMiddleware

# Tworzymy tabele w bazie, jeśli nie istnieją
Base.metadata.create_all(bind=engine)

# Tworzymy aplikację FastAPI
app = FastAPI(title="FotoBank", version="1.0.0")

# Konfiguracja CORS (połączenia frontend-backend)
origins = [
    "http://localhost:3000",  # frontend React działa na porcie 3000
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Podłączanie routerów
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(photos.router, prefix="/photos", tags=["Photos"])

@app.get("/")
def root():
    return {"message": "Witaj w FotoBank API!"}
