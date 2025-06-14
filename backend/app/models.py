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
    is_active       = Column(Boolean, default=False, nullable=False)
    activation_code = Column(String(6), nullable=True)



    # relacje
    photos     = relationship("Photo",    back_populates="owner")
    purchases  = relationship("Purchase", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)


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
    owner_id    = Column(Integer, ForeignKey("users.id"))
    created_at  = Column(DateTime, default=datetime.utcnow)

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

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    photo_id = Column(Integer, ForeignKey("photos.id"))
    purchase_date = Column(DateTime, default=datetime.utcnow)
    payment_status = Column(String(50), default="pending")
    total_cost = Column(Float, default=0.0)  # <== DODAJ TO
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="purchases")
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


# --------------------------- Cart -----------------------

class Cart(Base):
    __tablename__ = "cart"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete")


class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("cart.id"))
    photo_id = Column(Integer, ForeignKey("photos.id"))

    cart = relationship("Cart", back_populates="items")
    photo = relationship("Photo")

# --------------------------- UploadSession -----------------------

class UploadSession(Base):
    __tablename__ = "upload_sessions"
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(String(255), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_chunks = Column(Integer, nullable=False)
    received_chunks = Column(Integer, default=0)
    is_finished = Column(Boolean, default=False)

# --------------------------- Order -----------------------
class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="pending")

    user = relationship("User")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete")
    payment = relationship("Payment", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    photo_id = Column(Integer, ForeignKey("photos.id"))
    price = Column(Float)
    access_url = Column(String(255))

    order = relationship("Order", back_populates="items")
    photo = relationship("Photo")


# --------------------------- Payment -----------------------
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    provider = Column(String(50))
    status = Column(String(50))
    payment_date = Column(DateTime)
    transaction_id = Column(String(255))

    order = relationship("Order", back_populates="payment")


# --------------------------- PurchaseLog -----------------------
class PurchaseLog(Base):
    __tablename__ = "purchase_logs"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer)
    email          = Column(String(255))
    photo_id       = Column(Integer)
    purchase_date  = Column(DateTime)
    payment_status = Column(String(50))
    total_cost     = Column(Float)
    created_at     = Column(DateTime)
    updated_at     = Column(DateTime)
    logged_at      = Column(DateTime)
