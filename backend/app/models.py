from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, DECIMAL, Table
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

# ---------------------------
# Association table for photo-categories (many-to-many)
# ---------------------------
photo_categories = Table(
    'photo_categories',
    Base.metadata,
    Column('photo_id', Integer, ForeignKey('photos.id'), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True)
)

# ---------------------------
# Users
# ---------------------------
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False)
    username = Column(String(255))
    is_active = Column(Boolean, default=True)

    photos = relationship("Photo", back_populates="owner")
    carts = relationship("Cart", back_populates="user")
    orders = relationship("Order", back_populates="user")
    purchases = relationship("Purchase", back_populates="user")


# ---------------------------
# Photos
# ---------------------------
class Photo(Base):
    __tablename__ = 'photos'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(String(1024))
    category = Column(String(100))
    price = Column(Float, default=0.0)
    file_path = Column(String(255))
    thumb_path = Column(String(255))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="photos")
    categories = relationship("Category", secondary=photo_categories, back_populates="photos")


# ---------------------------
# Categories
# ---------------------------
class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    photos = relationship("Photo", secondary=photo_categories, back_populates="categories")


# ---------------------------
# Cart
# ---------------------------
class Cart(Base):
    __tablename__ = 'cart'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="carts")
    items = relationship("CartItem", back_populates="cart")


class CartItem(Base):
    __tablename__ = 'cart_items'

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("cart.id"), nullable=False)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)

    cart = relationship("Cart", back_populates="items")
    photo = relationship("Photo")


# ---------------------------
# Orders
# ---------------------------
class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50))

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", uselist=False, back_populates="order")


class OrderItem(Base):
    __tablename__ = 'order_items'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    price = Column(Float)
    access_url = Column(String(255))

    order = relationship("Order", back_populates="items")
    photo = relationship("Photo")


# ---------------------------
# Payments
# ---------------------------
class Payment(Base):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    provider = Column(String(100))
    status = Column(String(50))
    payment_date = Column(DateTime)
    transaction_id = Column(String(255))

    order = relationship("Order", back_populates="payment")


# ---------------------------
# Purchases
# ---------------------------
class Purchase(Base):
    __tablename__ = 'purchases'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    photo_id = Column(Integer, ForeignKey("photos.id"), nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    payment_status = Column(String(50))
    total_cost = Column(DECIMAL(10, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="purchases")
    photo = relationship("Photo")
