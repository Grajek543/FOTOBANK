# app/models.py
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, LargeBinary
)
from sqlalchemy.orm import relationship
from app.database import Base


# --------------------------- User ---------------------------
class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(String(50), default="user")
    username        = Column(String(255))
    banned          = Column(Boolean, default=False, nullable=False)
    full_banned     = Column(Boolean, default=False, nullable=False)


    # relacje
    photos     = relationship("Photo",    back_populates="owner")
    purchases  = relationship("Purchase", back_populates="user")


# --------------------------- Photo --------------------------
class Photo(Base):
    __tablename__ = "photos"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255))
    description = Column(String(1024))
    category    = Column(String(100))  # możesz później usunąć
    price       = Column(Float, default=0.0)

    file_path   = Column(String(255))
    thumb_path  = Column(String(255))
    file_data   = Column(LargeBinary)

    owner_id = Column(Integer, ForeignKey("users.id"))

    # relacje
    owner      = relationship("User", back_populates="photos")
    purchases  = relationship("Purchase", back_populates="photo")

    categories = relationship(
        "Category",
        secondary="photo_categories",
        backref="photos"
    )



# --------------------------- Purchase -----------------------
class Purchase(Base):
    __tablename__ = "purchases"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"))
    photo_id      = Column(Integer, ForeignKey("photos.id"))
    purchase_date = Column(DateTime, default=datetime.utcnow)
    payment_status = Column(String(50), default="pending")

    # relacje
    user  = relationship("User",  back_populates="purchases")
    photo = relationship("Photo", back_populates="purchases")


# --------------------------- Categories -----------------------
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)

class PhotoCategory(Base):
    __tablename__ = "photo_categories"
    photo_id = Column(Integer, ForeignKey("photos.id"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True)