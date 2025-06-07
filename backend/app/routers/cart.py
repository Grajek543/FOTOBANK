# app/routers/cart.py
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

    stmt = text("SELECT 1 FROM cart_items WHERE cart_id = :cid AND photo_id = :pid LIMIT 1")
    exists = db.execute(stmt, {"cid": cart.id, "pid": photo_id}).first()
    if exists:
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
    stmt = text("""
        SELECT ci.photo_id
        FROM cart c JOIN cart_items ci ON c.id = ci.cart_id
        WHERE c.user_id = :uid
    """)
    rows = db.execute(stmt, {"uid": user_id}).fetchall()
    return [r[0] for r in rows]


@router.delete("/remove/{photo_id}")
def remove_from_cart(photo_id: int, user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Koszyk nie istnieje")

    stmt = text("""
        DELETE FROM cart_items 
        WHERE cart_id = (SELECT id FROM cart WHERE user_id = :uid) AND photo_id = :pid
    """)
    db.execute(stmt, {"uid": user_id, "pid": photo_id})

    db.commit()
    return {"message": "Usunięto z koszyka"}

@router.post("/checkout")
def checkout(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Koszyk jest pusty.")

    stmt = text("""
        SELECT SUM(p.price)
        FROM cart c
        JOIN cart_items ci ON c.id = ci.cart_id
        JOIN photos p ON ci.photo_id = p.id
        WHERE c.user_id = :uid
    """)
    total = db.execute(stmt, {"uid": user_id}).scalar()


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
