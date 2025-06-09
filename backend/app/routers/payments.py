from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest
from app.paypal_client import paypal_client
from app import models
import os
from datetime import datetime, timedelta

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/create")
def create_order(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Koszyk jest pusty.")

    items = []
    total = 0

    for item in cart.items:
        price = item.photo.price
        total += price
        items.append({
            "name": item.photo.title,
            "unit_amount": {"currency_code": "PLN", "value": f"{price:.2f}"},
            "quantity": "1"
        })

    request = OrdersCreateRequest()
    request.prefer("return=representation")
    request.request_body({
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {
                "currency_code": "PLN",
                "value": f"{total:.2f}",
                "breakdown": {
                    "item_total": {
                        "currency_code": "PLN",
                        "value": f"{total:.2f}"
                    }
                }
            },
            "items": items
        }],
        "application_context": {
            "return_url": os.getenv("PAYPAL_RETURN_URL"),
            "cancel_url": os.getenv("PAYPAL_CANCEL_URL")
        }
    })

    response = paypal_client.execute(request)
    return {"order_id": response.result.id, "links": response.result.links}


@router.post("/capture/{order_id}")
def capture_order(order_id: str, user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    request = OrdersCaptureRequest(order_id)
    request.request_body({})
    response = paypal_client.execute(request)

    cart = db.query(models.Cart).filter_by(user_id=user_id).first()
    if not cart or not cart.items:
        raise HTTPException(400, "Koszyk pusty lub wygasł")

    new_order = models.Order(
        user_id=user_id,
        status="completed",
        created_at=datetime.utcnow() + timedelta(hours=2)
    )
    db.add(new_order)
    db.flush()

    total = 0

    for item in cart.items:
        db.add(models.OrderItem(
            order_id=new_order.id,
            photo_id=item.photo_id,
            price=item.photo.price,
            access_url=item.photo.file_path
        ))
        db.add(models.Purchase(
            user_id=user_id,
            photo_id=item.photo_id,
            purchase_date=datetime.utcnow() + timedelta(hours=2),
            payment_status="completed",
            total_cost=item.photo.price,
            created_at=datetime.utcnow() + timedelta(hours=2)
        ))
        total += item.photo.price

    db.query(models.CartItem).filter_by(cart_id=cart.id).delete()
    db.commit()

    return {"message": "Płatność zakończona sukcesem", "order_id": new_order.id}