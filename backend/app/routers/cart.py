from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.dependencies import get_current_user
from app import models

router = APIRouter()

@router.post("/add/{photo_id}")
def add_to_cart(photo_id: int, user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart:
        cart = models.Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    existing = db.query(models.CartItem).filter_by(cart_id=cart.id, photo_id=photo_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="To zdjęcie jest już w koszyku.")

    photo = db.query(models.Photo).filter_by(id=photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Zdjęcie nie istnieje.")
    if photo.owner_id == user_id:
        raise HTTPException(status_code=403, detail="Nie możesz dodać własnego zdjęcia do koszyka.")

    item = models.CartItem(cart_id=cart.id, photo_id=photo_id)
    db.add(item)
    db.commit()
    return {"message": "Dodano do koszyka"}



@router.get("/", response_model=list[int])
def view_cart(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart:
        return []
    return [item.photo_id for item in cart.items]

@router.delete("/remove/{photo_id}")
def remove_from_cart(photo_id: int, user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Koszyk nie istnieje")

    item = db.query(models.CartItem).filter_by(cart_id=cart.id, photo_id=photo_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Zdjęcie nie w koszyku")

    db.delete(item)
    db.commit()
    return {"message": "Usunięto z koszyka"}

@router.post("/checkout")
def checkout(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Koszyk jest pusty.")

    total = sum(item.photo.price for item in cart.items if item.photo)

    db.query(models.CartItem).filter_by(cart_id=cart.id).delete()
    db.commit()

    return {"message": f"Zamówienie złożone. Kwota: {total:.2f} zł"}

@router.get("/sum")
def get_cart_sum(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"DEBUG: user_id = {user_id}")
    result = db.execute(text("SELECT cart_sum(:uid)"), {"uid": user_id})
    total = result.scalar()
    print(f"DEBUG: total from cart_sum = {total}")
    return {"total": total or 0}


@router.get("/count")
def cart_item_count(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.execute(
        text("""
            SELECT COUNT(*) FROM cart_items
            WHERE cart_id = (SELECT id FROM cart WHERE user_id = :uid)
        """),
        {"uid": user_id}
    ).scalar()

    return {"count": result or 0}
