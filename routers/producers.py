from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_conn
from auth import get_current_user, get_current_producer, get_current_admin
import threading

router = APIRouter(prefix="/api/producers", tags=["producers"])

class CreateShopRequest(BaseModel):
    shop_name: str
    description: str = None
    bio: str = None
    address: str = None
    city: str = None
    state: str = "OK"
    zip_code: str = None
    latitude: float = None
    longitude: float = None
    service_radius_miles: int = 25
    fulfillment_pickup: bool = True
    fulfillment_delivery: bool = False
    fulfillment_shipping: bool = False
    delivery_fee: float = 0.00
    tax_rate: float = 0.08375

class UpdateShopRequest(BaseModel):
    shop_name: str = None
    description: str = None
    bio: str = None
    address: str = None
    city: str = None
    state: str = None
    zip_code: str = None
    latitude: float = None
    longitude: float = None
    service_radius_miles: int = None
    fulfillment_pickup: bool = None
    fulfillment_delivery: bool = None
    fulfillment_shipping: bool = None
    delivery_fee: float = None
    tax_rate: float = None

@router.post("/setup")
def setup_shop(req: CreateShopRequest, user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM producers WHERE user_id = %s", (user["id"],))
    if cur.fetchone():
        cur.close(); conn.close()
        raise HTTPException(400, "Shop already exists")
    cur.execute("""
        INSERT INTO producers (
            user_id, shop_name, description, bio, address, city, state, zip_code,
            latitude, longitude, service_radius_miles,
            fulfillment_pickup, fulfillment_delivery, fulfillment_shipping,
            delivery_fee, tax_rate
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
    """, (user["id"], req.shop_name, req.description, req.bio,
          req.address, req.city, req.state, req.zip_code,
          req.latitude, req.longitude, req.service_radius_miles,
          req.fulfillment_pickup, req.fulfillment_delivery, req.fulfillment_shipping,
          req.delivery_fee, req.tax_rate))
    producer_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"producer_id": producer_id, "message": "Shop created - pending admin approval"}

@router.get("/me")
def get_my_shop(user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT p.*, u.email, u.full_name FROM producers p
        JOIN users u ON p.user_id = u.id WHERE p.user_id = %s
    """, (user["id"],))
    row = cur.fetchone(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    if not row: raise HTTPException(404, "No shop found")
    return dict(zip(cols, row))

@router.patch("/me")
def update_my_shop(req: UpdateShopRequest, user=Depends(get_current_producer)):
    fields = {k: v for k, v in req.dict().items() if v is not None}
    if not fields: raise HTTPException(400, "No fields to update")
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [user["id"]]
    conn = get_conn(); cur = conn.cursor()
    cur.execute(f"UPDATE producers SET {set_clause}, updated_at = NOW() WHERE user_id = %s", values)
    conn.commit(); cur.close(); conn.close()
    return {"message": "Shop updated"}

@router.get("/nearby")
def get_nearby_producers(lat: float, lng: float, radius_miles: float = 25, category: str = None):
    conn = get_conn(); cur = conn.cursor()
    query = """
        SELECT DISTINCT p.id, p.shop_name, p.description, p.city, p.state,
               p.latitude, p.longitude, p.fulfillment_pickup, p.fulfillment_delivery,
               p.fulfillment_shipping, p.avg_rating, p.review_count,
               p.tax_rate, p.delivery_fee,
               (3959 * acos(
                   cos(radians(%s)) * cos(radians(p.latitude)) *
                   cos(radians(p.longitude) - radians(%s)) +
                   sin(radians(%s)) * sin(radians(p.latitude))
               )) AS distance_miles
        FROM producers p
        LEFT JOIN products pr ON pr.producer_id = p.id AND pr.is_active = TRUE
        WHERE p.is_active = TRUE AND p.admin_approved = TRUE
          AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
          AND (3959 * acos(
              cos(radians(%s)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians(%s)) +
              sin(radians(%s)) * sin(radians(p.latitude))
          )) <= %s
    """
    params = [lat, lng, lat, lat, lng, lat, radius_miles]
    if category:
        query += " AND pr.category = %s"
        params.append(category)
    query += " ORDER BY distance_miles ASC LIMIT 50"
    cur.execute(query, params)
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

@router.get("/admin/pending")
def get_pending_producers(admin=Depends(get_current_admin)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.shop_name, p.city, p.state, p.created_at, u.email, u.full_name
        FROM producers p JOIN users u ON p.user_id = u.id
        WHERE p.admin_approved = FALSE AND p.is_active = TRUE
        ORDER BY p.created_at ASC
    """)
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

@router.post("/admin/{producer_id}/approve")
def approve_producer(producer_id: int, admin=Depends(get_current_admin)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        UPDATE producers SET admin_approved = TRUE, admin_approved_at = NOW()
        WHERE id = %s
        RETURNING shop_name, user_id
    """, (producer_id,))
    row = cur.fetchone()
    conn.commit()

    if row:
        shop_name, user_id = row
        # Get producer email and name for notification
        cur.execute("SELECT email, full_name FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        cur.close(); conn.close()

        if user_row:
            email, full_name = user_row
            # Send approval email in background thread
            def send_approval():
                try:
                    from emails import email_producer_approved
                    email_producer_approved(email, shop_name, full_name)
                except Exception as e:
                    print(f"Approval email failed: {e}")
            threading.Thread(target=send_approval, daemon=True).start()

        return {"message": f"{shop_name} approved"}
    else:
        cur.close(); conn.close()
        raise HTTPException(404, "Producer not found")

@router.post("/admin/{producer_id}/suspend")
def suspend_producer(producer_id: int, admin=Depends(get_current_admin)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("UPDATE producers SET is_active = FALSE WHERE id = %s RETURNING shop_name", (producer_id,))
    row = cur.fetchone(); conn.commit(); cur.close(); conn.close()
    if not row: raise HTTPException(404, "Producer not found")
    return {"message": f"{row[0]} suspended"}

@router.get("/profile/{producer_id}")
def get_producer_profile(producer_id: int):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.shop_name, p.description, p.bio, p.city, p.state,
               p.latitude, p.longitude, p.service_radius_miles,
               p.fulfillment_pickup, p.fulfillment_delivery, p.fulfillment_shipping,
               p.delivery_fee, p.tax_rate, p.avg_rating, p.review_count, p.created_at
        FROM producers p WHERE p.id = %s AND p.is_active = TRUE AND p.admin_approved = TRUE
    """, (producer_id,))
    row = cur.fetchone(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    if not row: raise HTTPException(404, "Producer not found")
    return dict(zip(cols, row))
