# app/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user")
    username = Column(String(255), nullable=True)  # Nazwa użytkownika jako tekst, bez hashowania
    photos = relationship("Photo", back_populates="owner")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(String(1024))
    category = Column(String(100))
    price = Column(Float, default=0.0)
    file_path = Column(String(255))
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="photos")

