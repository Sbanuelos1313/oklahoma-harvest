from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
from database import get_conn
from auth import get_current_user, get_current_shopper, get_current_producer
import stripe
import os
import threading

router = APIRouter(prefix="/api/orders", tags=["orders"])
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
PLATFORM_FEE = 0
AUTO_CANCEL_HOURS = 12

class OrderItem(BaseModel):
    product_id: int
    quantity: int

class PlaceOrderRequest(BaseModel):
    producer_id: int
    items: List[OrderItem]
    fulfillment_type: str = "pickup"
    delivery_address: str = None
    pickup_notes: str = None
    payment_method_id: str

class UpdateOrderStatusRequest(BaseModel):
    status: str
    cancel_reason: str = None

VALID_TRANSITIONS = {
    "pending":          ["confirmed", "cancelled"],
    "confirmed":        ["ready_for_pickup", "out_for_delivery", "cancelled"],
    "ready_for_pickup": ["fulfilled"],
    "out_for_delivery": ["fulfilled"],
}

def send_email_async(fn, *args, **kwargs):
    """Run email sending in background thread."""
    def run():
        try:
            fn(*args, **kwargs)
        except Exception as e:
            print(f"Email error: {e}")
    threading.Thread(target=run, daemon=True).start()

@router.post("/")
def place_order(req: PlaceOrderRequest, user=Depends(get_current_shopper)):
    if req.fulfillment_type not in ("pickup", "delivery", "shipping"):
        raise HTTPException(400, "fulfillment_type must be pickup, delivery, or shipping")
    if req.fulfillment_type == "delivery" and not req.delivery_address:
        raise HTTPException(400, "delivery_address required for delivery")
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT id, tax_rate, delivery_fee, fulfillment_pickup, fulfillment_delivery,
               fulfillment_shipping, stripe_account_id
        FROM producers WHERE id = %s AND is_active = TRUE AND admin_approved = TRUE
    """, (req.producer_id,))
    producer = cur.fetchone()
    if not producer: cur.close(); conn.close(); raise HTTPException(404, "Producer not found")
    prod_id, tax_rate, delivery_fee, fp, fd, fs, stripe_acct = producer
    if req.fulfillment_type == "pickup" and not fp: raise HTTPException(400, "Producer does not offer pickup")
    if req.fulfillment_type == "delivery" and not fd: raise HTTPException(400, "Producer does not offer delivery")
    if req.fulfillment_type == "shipping" and not fs: raise HTTPException(400, "Producer does not offer shipping")
    subtotal = 0.0
    items_to_insert = []
    for item in req.items:
        if item.quantity < 1: raise HTTPException(400, "Quantity must be at least 1")
        cur.execute("SELECT id, name, unit, price, quantity_available, is_active, producer_id FROM products WHERE id = %s", (item.product_id,))
        product = cur.fetchone()
        if not product: cur.close(); conn.close(); raise HTTPException(404, f"Product {item.product_id} not found")
        p_id, p_name, p_unit, p_price, p_qty, p_active, p_producer_id = product
        if p_producer_id != req.producer_id: cur.close(); conn.close(); raise HTTPException(400, f"Product '{p_name}' is from a different producer.")
        if not p_active: cur.close(); conn.close(); raise HTTPException(400, f"Product '{p_name}' is not available")
        if p_qty < item.quantity: cur.close(); conn.close(); raise HTTPException(400, f"Only {p_qty} of '{p_name}' available")
        line_total = round(p_price * item.quantity, 2)
        subtotal += line_total
        items_to_insert.append((item.product_id, p_name, p_unit, item.quantity, p_price, line_total))
    subtotal = round(subtotal, 2)
    d_fee = round(delivery_fee, 2) if req.fulfillment_type == "delivery" else 0.0
    tax_amount = round(subtotal * tax_rate, 2)
    total = round(subtotal + d_fee + tax_amount, 2)
    total_cents = int(total * 100)
    try:
        cur.execute("SELECT stripe_customer_id FROM users WHERE id = %s", (user["id"],))
        stripe_cid = cur.fetchone()[0]
        if not stripe_cid:
            customer = stripe.Customer.create(email=user["email"], metadata={"user_id": user["id"]})
            stripe_cid = customer.id
            cur.execute("UPDATE users SET stripe_customer_id = %s WHERE id = %s", (stripe_cid, user["id"]))
        intent_kwargs = {
            "amount": total_cents, "currency": "usd", "customer": stripe_cid,
            "payment_method": req.payment_method_id, "confirm": True,
            "automatic_payment_methods": {"enabled": True, "allow_redirects": "never"},
            "metadata": {"platform": "from_our_place", "shopper_id": user["id"], "producer_id": req.producer_id}
        }
        if stripe_acct:
            intent_kwargs["transfer_data"] = {"destination": stripe_acct}
            if PLATFORM_FEE > 0:
                intent_kwargs["application_fee_amount"] = int(total_cents * PLATFORM_FEE)
        intent = stripe.PaymentIntent.create(**intent_kwargs)
    except stripe.error.CardError as e:
        cur.close(); conn.close(); raise HTTPException(402, f"Payment failed: {e.user_message}")
    except Exception as e:
        cur.close(); conn.close(); raise HTTPException(500, f"Payment error: {str(e)}")

    respond_by = datetime.utcnow() + timedelta(hours=AUTO_CANCEL_HOURS)
    cur.execute("""
        INSERT INTO orders (shopper_id, producer_id, status, fulfillment_type,
            subtotal, tax_amount, delivery_fee, total,
            stripe_payment_intent_id, respond_by_at, pickup_notes, delivery_address)
        VALUES (%s,%s,'pending',%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (user["id"], req.producer_id, req.fulfillment_type, subtotal, tax_amount,
          d_fee, total, intent.id, respond_by, req.pickup_notes, req.delivery_address))
    order_id = cur.fetchone()[0]

    for p_id, p_name, p_unit, qty, price, line_total in items_to_insert:
        cur.execute("""
            INSERT INTO order_items (order_id, product_id, product_name, product_unit, quantity, unit_price, subtotal)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, (order_id, p_id, p_name, p_unit, qty, price, line_total))
        cur.execute("UPDATE products SET quantity_available = quantity_available - %s WHERE id = %s", (qty, p_id))

    # Get producer email for notification
    cur.execute("""
        SELECT u.email, u.full_name, p.shop_name
        FROM producers p JOIN users u ON p.user_id = u.id
        WHERE p.id = %s
    """, (req.producer_id,))
    prod_info = cur.fetchone()

    # Notification in DB
    cur.execute("""
        INSERT INTO notifications (user_id, type, title, body, order_id)
        SELECT u.id, 'order_placed', 'New Order Received', 'Order #' || %s || ' placed — respond within 12 hours', %s
        FROM producers p JOIN users u ON p.user_id = u.id WHERE p.id = %s
    """, (order_id, order_id, req.producer_id))

    conn.commit(); cur.close(); conn.close()

    # Send email to producer async
    if prod_info:
        prod_email, prod_name, shop_name = prod_info
        items_text = "<br>".join([f"{i[3]}x {i[1]} — ${i[5]:.2f}" for i in items_to_insert])
        from emails import email_new_order
        send_email_async(email_new_order, prod_email, prod_name, shop_name,
                        order_id, user["full_name"], items_text, total, req.fulfillment_type)

    return {
        "order_id": order_id, "total": total, "status": "pending",
        "respond_by": respond_by.isoformat(),
        "message": "Order placed — producer has 12 hours to confirm"
    }

@router.get("/my")
def get_my_orders(user=Depends(get_current_shopper)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT o.id, o.status, o.fulfillment_type, o.subtotal, o.tax_amount,
               o.delivery_fee, o.total, o.created_at, o.respond_by_at, p.shop_name, p.city
        FROM orders o JOIN producers p ON o.producer_id = p.id
        WHERE o.shopper_id = %s ORDER BY o.created_at DESC
    """, (user["id"],))
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

@router.get("/producer/incoming")
def get_producer_orders(user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM producers WHERE user_id = %s", (user["id"],))
    producer = cur.fetchone()
    if not producer: cur.close(); conn.close(); raise HTTPException(404, "No shop found")
    cur.execute("""
        SELECT o.id, o.status, o.fulfillment_type, o.total, o.created_at,
               o.respond_by_at, u.full_name as shopper_name,
               EXTRACT(EPOCH FROM (o.respond_by_at - NOW())) / 3600 as hours_remaining
        FROM orders o JOIN users u ON o.shopper_id = u.id
        WHERE o.producer_id = %s
        ORDER BY CASE o.status WHEN 'pending' THEN 1 WHEN 'confirmed' THEN 2 ELSE 3 END, o.created_at DESC
        LIMIT 50
    """, (producer[0],))
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

@router.get("/{order_id}")
def get_order(order_id: int, user=Depends(get_current_user)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT o.*, p.shop_name, p.city, p.state, u.full_name as shopper_name, u.email as shopper_email
        FROM orders o JOIN producers p ON o.producer_id = p.id JOIN users u ON o.shopper_id = u.id
        WHERE o.id = %s
    """, (order_id,))
    order = cur.fetchone()
    if not order: cur.close(); conn.close(); raise HTTPException(404, "Order not found")
    cols = [d[0] for d in cur.description]
    order_dict = dict(zip(cols, order))
    if user["role"] == "shopper" and order_dict["shopper_id"] != user["id"]:
        cur.close(); conn.close(); raise HTTPException(403, "Not your order")
    if user["role"] == "producer":
        cur.execute("SELECT id FROM producers WHERE user_id = %s", (user["id"],))
        prod = cur.fetchone()
        if not prod or order_dict["producer_id"] != prod[0]:
            cur.close(); conn.close(); raise HTTPException(403, "Not your order")
    cur.execute("SELECT product_name, product_unit, quantity, unit_price, subtotal FROM order_items WHERE order_id = %s", (order_id,))
    items = cur.fetchall(); item_cols = [d[0] for d in cur.description]
    order_dict["items"] = [dict(zip(item_cols, i)) for i in items]
    cur.close(); conn.close()
    return order_dict

@router.patch("/{order_id}/status")
def update_order_status(order_id: int, req: UpdateOrderStatusRequest, user=Depends(get_current_user)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT o.status, o.shopper_id, o.producer_id, o.stripe_payment_intent_id, o.total, o.fulfillment_type
        FROM orders o WHERE o.id = %s
    """, (order_id,))
    order = cur.fetchone()
    if not order: cur.close(); conn.close(); raise HTTPException(404, "Order not found")
    current_status, shopper_id, producer_id, intent_id, total, fulfillment_type = order

    if user["role"] == "producer":
        cur.execute("SELECT id FROM producers WHERE user_id = %s", (user["id"],))
        prod = cur.fetchone()
        if not prod or prod[0] != producer_id: cur.close(); conn.close(); raise HTTPException(403, "Not your order")
    elif user["role"] == "shopper":
        if shopper_id != user["id"]: cur.close(); conn.close(); raise HTTPException(403, "Not your order")
        if req.status != "fulfilled": cur.close(); conn.close(); raise HTTPException(403, "Shoppers can only mark fulfilled")

    allowed = VALID_TRANSITIONS.get(current_status, [])
    if req.status not in allowed and user["role"] != "admin":
        cur.close(); conn.close(); raise HTTPException(400, f"Cannot move from '{current_status}' to '{req.status}'")

    ts_field = {"confirmed":"confirmed_at","fulfilled":"fulfilled_at","cancelled":"cancelled_at","auto_cancelled":"cancelled_at","ready_for_pickup":"ready_at"}.get(req.status)
    set_clause = "status = %s, updated_at = NOW()"
    params = [req.status]
    if ts_field: set_clause += f", {ts_field} = NOW()"
    if req.cancel_reason and req.status in ("cancelled", "auto_cancelled"):
        set_clause += ", cancel_reason = %s"; params.append(req.cancel_reason)
    params.append(order_id)
    cur.execute(f"UPDATE orders SET {set_clause} WHERE id = %s", params)

    if req.status in ("cancelled", "auto_cancelled") and intent_id:
        try: stripe.Refund.create(payment_intent=intent_id)
        except Exception as e: print(f"Refund failed for order {order_id}: {e}")

    # Get shopper + producer info for emails
    cur.execute("SELECT email, full_name FROM users WHERE id = %s", (shopper_id,))
    shopper_info = cur.fetchone()
    cur.execute("""
        SELECT u.email, p.shop_name FROM producers p JOIN users u ON p.user_id = u.id WHERE p.id = %s
    """, (producer_id,))
    producer_info = cur.fetchone()

    # DB notification
    notif_map = {
        "confirmed": ("Order Confirmed ✓", f"Order #{order_id} was confirmed."),
        "ready_for_pickup": ("Ready for Pickup! 🛍️", f"Order #{order_id} is ready for pickup."),
        "out_for_delivery": ("On Its Way! 🚚", f"Order #{order_id} is out for delivery."),
        "fulfilled": ("Order Complete ✓", f"Order #{order_id} fulfilled. Leave a review!"),
        "cancelled": ("Order Cancelled", f"Order #{order_id} cancelled. Refund issued."),
        "auto_cancelled": ("Order Auto-Cancelled", f"Order #{order_id} not confirmed in time. Full refund issued."),
    }
    if req.status in notif_map:
        title, body = notif_map[req.status]
        cur.execute("INSERT INTO notifications (user_id, type, title, body, order_id) VALUES (%s,%s,%s,%s,%s)",
                    (shopper_id, req.status, title, body, order_id))

    conn.commit(); cur.close(); conn.close()

    # Send emails async
    if shopper_info and producer_info:
        shopper_email, shopper_name = shopper_info
        _, shop_name = producer_info
        try:
            from emails import email_order_confirmed, email_order_ready, email_order_cancelled
            if req.status == "confirmed":
                send_email_async(email_order_confirmed, shopper_email, shopper_name, shop_name, order_id, fulfillment_type, float(total))
            elif req.status in ("ready_for_pickup", "out_for_delivery"):
                send_email_async(email_order_ready, shopper_email, shopper_name, shop_name, order_id, fulfillment_type)
            elif req.status == "cancelled":
                send_email_async(email_order_cancelled, shopper_email, shopper_name, shop_name, order_id, float(total), auto=False)
            elif req.status == "auto_cancelled":
                send_email_async(email_order_cancelled, shopper_email, shopper_name, shop_name, order_id, float(total), auto=True)
        except Exception as e:
            print(f"Email dispatch error: {e}")

    return {"message": f"Order status updated to {req.status}", "order_id": order_id}

def run_auto_cancel():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, stripe_payment_intent_id, shopper_id, producer_id, total FROM orders WHERE status = 'pending' AND respond_by_at < NOW()")
    expired = cur.fetchall()
    for order_id, intent_id, shopper_id, producer_id, total in expired:
        cur.execute("UPDATE orders SET status = 'auto_cancelled', cancelled_at = NOW(), cancel_reason = 'Producer did not respond within 12 hours', updated_at = NOW() WHERE id = %s", (order_id,))
        if intent_id:
            try: stripe.Refund.create(payment_intent=intent_id)
            except Exception as e: print(f"Auto-cancel refund failed for order {order_id}: {e}")
        cur.execute("INSERT INTO notifications (user_id, type, title, body, order_id) VALUES (%s,'auto_cancelled','Order Auto-Cancelled','Order #' || %s || ' was not confirmed in time. Full refund issued.',%s)",
                    (shopper_id, order_id, order_id))
        # Email shopper
        cur.execute("SELECT email, full_name FROM users WHERE id = %s", (shopper_id,))
        shopper = cur.fetchone()
        cur.execute("SELECT p.shop_name FROM producers p WHERE p.id = %s", (producer_id,))
        prod = cur.fetchone()
        if shopper and prod:
            from emails import email_order_cancelled
            send_email_async(email_order_cancelled, shopper[0], shopper[1], prod[0], order_id, float(total), auto=True)
    conn.commit()
    print(f"Auto-cancel: processed {len(expired)} expired orders")
    cur.close(); conn.close()


# ── PLACE ORDER FROM CONFIRMED PAYMENT ────────────────────────────────────

class PlaceOrderFromPaymentRequest(BaseModel):
    producer_id: int
    items: List[OrderItem]
    fulfillment_type: str = "pickup"
    delivery_address: str = None
    pickup_notes: str = None
    payment_intent_id: str

@router.post("/from-payment")
def place_order_from_payment(req: PlaceOrderFromPaymentRequest, user=Depends(get_current_shopper)):
    """Place order after Stripe payment is confirmed on frontend."""
    conn = get_conn(); cur = conn.cursor()

    # Verify payment intent exists and is succeeded
    try:
        intent = stripe.PaymentIntent.retrieve(req.payment_intent_id)
        if intent.status not in ("succeeded", "requires_capture"):
            cur.close(); conn.close()
            raise HTTPException(402, f"Payment not confirmed: {intent.status}")
    except stripe.error.StripeError as e:
        cur.close(); conn.close()
        raise HTTPException(402, f"Payment verification failed: {str(e)}")

    # Validate producer
    cur.execute("""
        SELECT id, tax_rate, delivery_fee FROM producers
        WHERE id = %s AND is_active = TRUE AND admin_approved = TRUE
    """, (req.producer_id,))
    producer = cur.fetchone()
    if not producer: cur.close(); conn.close(); raise HTTPException(404, "Producer not found")
    prod_id, tax_rate, delivery_fee = producer

    # Price items
    subtotal = 0.0
    items_to_insert = []
    for item in req.items:
        cur.execute("SELECT id, name, unit, price, quantity_available, producer_id FROM products WHERE id = %s AND is_active = TRUE", (item.product_id,))
        product = cur.fetchone()
        if not product: cur.close(); conn.close(); raise HTTPException(404, f"Product {item.product_id} not found")
        p_id, p_name, p_unit, p_price, p_qty, p_producer_id = product
        if p_producer_id != req.producer_id: cur.close(); conn.close(); raise HTTPException(400, "Product from wrong producer")
        if p_qty < item.quantity: cur.close(); conn.close(); raise HTTPException(400, f"Insufficient stock for {p_name}")
        line_total = round(p_price * item.quantity, 2)
        subtotal += line_total
        items_to_insert.append((item.product_id, p_name, p_unit, item.quantity, p_price, line_total))

    subtotal = round(subtotal, 2)
    d_fee = round(delivery_fee, 2) if req.fulfillment_type == "delivery" else 0.0
    tax_amount = round(subtotal * tax_rate, 2)
    total = round(subtotal + d_fee + tax_amount, 2)
    respond_by = datetime.utcnow() + timedelta(hours=AUTO_CANCEL_HOURS)

    # Create order
    cur.execute("""
        INSERT INTO orders (shopper_id, producer_id, status, fulfillment_type,
            subtotal, tax_amount, delivery_fee, total,
            stripe_payment_intent_id, respond_by_at, pickup_notes, delivery_address)
        VALUES (%s,%s,'pending',%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (user["id"], req.producer_id, req.fulfillment_type, subtotal, tax_amount,
          d_fee, total, req.payment_intent_id, respond_by, req.pickup_notes, req.delivery_address))
    order_id = cur.fetchone()[0]

    for p_id, p_name, p_unit, qty, price, line_total in items_to_insert:
        cur.execute("INSERT INTO order_items (order_id, product_id, product_name, product_unit, quantity, unit_price, subtotal) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (order_id, p_id, p_name, p_unit, qty, price, line_total))
        cur.execute("UPDATE products SET quantity_available = quantity_available - %s WHERE id = %s", (qty, p_id))

    # Notify producer
    cur.execute("""
        SELECT u.email, u.full_name, p.shop_name FROM producers p JOIN users u ON p.user_id = u.id WHERE p.id = %s
    """, (req.producer_id,))
    prod_info = cur.fetchone()

    cur.execute("""
        INSERT INTO notifications (user_id, type, title, body, order_id)
        SELECT u.id, 'order_placed', 'New Order Received', 'Order #' || %s || ' — respond within 12 hours', %s
        FROM producers p JOIN users u ON p.user_id = u.id WHERE p.id = %s
    """, (order_id, order_id, req.producer_id))

    conn.commit(); cur.close(); conn.close()

    if prod_info:
        prod_email, prod_name, shop_name = prod_info
        items_text = "<br>".join([f"{i[3]}x {i[1]} — ${i[5]:.2f}" for i in items_to_insert])
        from emails import email_new_order
        send_email_async(email_new_order, prod_email, prod_name, shop_name, order_id, user["full_name"], items_text, total, req.fulfillment_type)

    return {"order_id": order_id, "total": total, "status": "pending", "message": "Order placed successfully!"}
