# app/main.py
from fastapi import FastAPI
from app.database import engine, Base
from app.routers import users, photos
from fastapi.middleware.cors import CORSMiddleware

from app.routers import users, photos
from app.database import Base, engine


Base.metadata.create_all(bind=engine)


app = FastAPI(title="FotoBank", version="1.0.0")

origins = [
    "http://localhost:3000", 

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(photos.router, prefix="/photos", tags=["Photos"])

@app.get("/")
def root():
    return {"message": "Witaj w FotoBank API!"}
