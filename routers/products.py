from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from database import get_conn
from auth import get_current_producer, get_current_user

router = APIRouter(prefix="/api/products", tags=["products"])

PROHIBITED_KEYWORDS = ["cannabis","hemp","cbd","thc","delta","delta-8","delta-9","marijuana","weed","edible","infused","420","dispensary"]
VALID_CATEGORIES = ["eggs_dairy","meat","vegetables","fruit","baked","pantry","herbs","honey","candy","jams","flowers","essential_oils","tinctures","candles","jewelry","soaps","plants","crafts","sauces","nuts","coffee_tea","other"]

def check_prohibited(name, description=""):
    text = f"{name} {description}".lower()
    return any(k in text for k in PROHIBITED_KEYWORDS)

class CreateProductRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: float
    unit: str
    quantity_available: int = 0
    image_url: Optional[str] = None
    tags: List[str] = []

class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    quantity_available: Optional[int] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

@router.post("/")
def create_product(req: CreateProductRequest, user=Depends(get_current_producer)):
    if req.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}")
    if check_prohibited(req.name, req.description or ""):
        raise HTTPException(400, "Prohibited item keywords detected (cannabis/hemp/CBD/THC/Delta not allowed)")
    if req.price <= 0:
        raise HTTPException(400, "Price must be greater than 0")
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM producers WHERE user_id = %s", (user["id"],))
    producer = cur.fetchone()
    if not producer: cur.close(); conn.close(); raise HTTPException(403, "Complete shop setup first")
    cur.execute("""
        INSERT INTO products (producer_id, name, description, category, price, unit,
                              quantity_available, image_url, tags)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
    """, (producer[0], req.name, req.description, req.category, req.price, req.unit,
          req.quantity_available, req.image_url, req.tags))
    product_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"product_id": product_id, "message": "Product created"}

@router.get("/my")
def get_my_products(user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM producers WHERE user_id = %s", (user["id"],))
    producer = cur.fetchone()
    if not producer: cur.close(); conn.close(); raise HTTPException(404, "No shop found")
    cur.execute("""
        SELECT id, name, description, category, price, unit,
               quantity_available, is_active, tags, created_at
        FROM products WHERE producer_id = %s ORDER BY is_active DESC, name ASC
    """, (producer[0],))
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

@router.patch("/{product_id}")
def update_product(product_id: int, req: UpdateProductRequest, user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT pr.id FROM products pr JOIN producers p ON pr.producer_id = p.id
        WHERE pr.id = %s AND p.user_id = %s
    """, (product_id, user["id"]))
    if not cur.fetchone(): cur.close(); conn.close(); raise HTTPException(403, "Product not found or not yours")
    if req.name or req.description:
        if check_prohibited(req.name or "", req.description or ""):
            cur.close(); conn.close(); raise HTTPException(400, "Prohibited item keywords detected")
    fields = {k: v for k, v in req.dict().items() if v is not None}
    if not fields: cur.close(); conn.close(); raise HTTPException(400, "No fields to update")
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [product_id]
    cur.execute(f"UPDATE products SET {set_clause}, updated_at = NOW() WHERE id = %s", values)
    conn.commit(); cur.close(); conn.close()
    return {"message": "Product updated"}

@router.delete("/{product_id}")
def delete_product(product_id: int, user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        DELETE FROM products USING producers
        WHERE products.id = %s AND products.producer_id = producers.id
        AND producers.user_id = %s RETURNING products.id
    """, (product_id, user["id"]))
    if not cur.fetchone(): conn.rollback(); cur.close(); conn.close(); raise HTTPException(403, "Not found or not yours")
    conn.commit(); cur.close(); conn.close()
    return {"message": "Product deleted"}

@router.get("/producer/{producer_id}")
def get_producer_products(producer_id: int, category: str = None):
    conn = get_conn(); cur = conn.cursor()
    query = """
        SELECT id, name, description, category, price, unit, quantity_available, image_url, tags
        FROM products WHERE producer_id = %s AND is_active = TRUE AND quantity_available > 0
    """
    params = [producer_id]
    if category:
        query += " AND category = %s"
        params.append(category)
    query += " ORDER BY category, name"
    cur.execute(query, params)
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

@router.get("/search")
def search_products(q: str = None, category: str = None, lat: float = None, lng: float = None, radius_miles: float = 25):
    conn = get_conn(); cur = conn.cursor()
    query = """
        SELECT pr.id, pr.name, pr.description, pr.category, pr.price, pr.unit,
               pr.quantity_available, pr.image_url, pr.tags,
               p.id as producer_id, p.shop_name, p.city, p.state,
               p.fulfillment_pickup, p.fulfillment_delivery, p.fulfillment_shipping, p.avg_rating
        FROM products pr JOIN producers p ON pr.producer_id = p.id
        WHERE pr.is_active = TRUE AND pr.quantity_available > 0
          AND pr.is_prohibited = FALSE AND p.admin_approved = TRUE AND p.is_active = TRUE
    """
    params = []
    if q:
        query += " AND (pr.name ILIKE %s OR pr.description ILIKE %s OR pr.tags::text ILIKE %s)"
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
    if category:
        query += " AND pr.category = %s"
        params.append(category)
    if lat and lng:
        query += """
            AND (3959 * acos(
                cos(radians(%s)) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians(%s)) +
                sin(radians(%s)) * sin(radians(p.latitude))
            )) <= %s
        """
        params.extend([lat, lng, lat, radius_miles])
    query += " ORDER BY p.avg_rating DESC, pr.name ASC LIMIT 100"
    cur.execute(query, params)
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

