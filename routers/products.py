from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, params
from pydantic import BaseModel, Field
from typing import List, Optional
from database import get_conn
from auth import get_current_producer, get_current_user

import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
)
router = APIRouter(
    prefix="/api/products",
    tags=["products"]
)


PROHIBITED_KEYWORDS = ["cannabis","hemp","cbd","thc","delta","delta-8","delta-9","marijuana","weed","edible","infused","420","dispensary"]
VALID_CATEGORIES = [
    "produce",
    "meat",
    "baked",
    "eggs_dairy",
    "eggs",
    "herbs",
    "candles",
    "jewelry",
    "clothing",
    "coffee_tea",
    "crafts",
    "honey",
    "jams",
    "flowers",
    "microgreens",
    "fruit",
    "soaps",
    "home_living",
    "pantry",
    "pet_products",
    "nuts",
    "sauces",
    "spices",
    "essential_oils",
    "farm_garden",
    "plants",
    "plants_flowers",
    "local_makers",
    "gifts",
    "tinctures_remedies",
    "wellness",
    "seasonal",
    "other",
    "candy",
]

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
    tags: List[str] = Field(default_factory=list)
    
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

@router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    user=Depends(get_current_producer),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an image",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Image file is empty",
        )

    try:
        result = cloudinary.uploader.upload(
            contents,
            folder="from_our_place/products",
            transformation=[
                {
                    "width": 1200,
                    "height": 1200,
                    "crop": "limit",
                    "quality": "auto",
                    "fetch_format": "auto",
                }
            ],
            resource_type="image",
        )

        return {
            "url": result["secure_url"],
        }

    except Exception as exc:
        print(
            "Product image upload error:",
            str(exc),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to upload product image",
        )

@router.get("/my")
def get_my_products(
    user=Depends(get_current_producer)
):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM producers WHERE user_id = %s",
        (user["id"],)
    )

    producer = cur.fetchone()

    if not producer:
        cur.close()
        conn.close()
        raise HTTPException(
            404,
            "No shop found"
        )

    cur.execute("""
        SELECT
            id,
            name,
            description,
            category,
            price,
            unit,
            quantity_available,
            image_url,
            is_active,
            tags,
            created_at
        FROM products
        WHERE producer_id = %s
        ORDER BY is_active DESC, name ASC
    """, (producer[0],))

    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]

    cur.close()
    conn.close()

    return [
        dict(zip(cols, row))
        for row in rows
    ]

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
def search_products(
    q: str = None, 
    category: str = None, 

    lat: float = None, 
    lng: float = None, 
    radius_miles: float = 25,

    pickup: bool = None,
    delivery: bool = None,
    shipping: bool = None,

    min_price: float = None,
    max_price: float = None,

    sort_by: str = "rating",

    limit: int = 25,
    offset: int = 0
):
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
    if min_price is not None:
    query += " AND pr.price >= %s"
    params.append(min_price)

    if max_price is not None:
    query += " AND pr.price <= %s"
    params.append(max_price)

    if pickup:
    query += " AND p.fulfillment_pickup = TRUE"

    if delivery:
    query += " AND p.fulfillment_delivery = TRUE"

    if shipping:
    query += " AND p.fulfillment_shipping = TRUE"

    if lat and lng:
        query += """
            AND (3959 * acos(
                cos(radians(%s)) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians(%s)) +
                sin(radians(%s)) * sin(radians(p.latitude))
            )) <= %s
        """
        params.extend([lat, lng, lat, radius_miles])
    if sort == "price_low":
        query += " ORDER BY pr.price ASC"

    elif sort == "price_high":
        query += " ORDER BY pr.price DESC"

    elif sort == "newest":
        query += " ORDER BY pr.created_at DESC"

    elif sort == "alphabetical":
        query += " ORDER BY pr.name ASC"

    elif sort == "distance" and lat and lng:
        query += """
            ORDER BY
            (3959 * acos(
                cos(radians(%s)) *
                cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians(%s))
                +
                sin(radians(%s)) *
                sin(radians(p.latitude))
            )) ASC
        """

        params.extend([lat, lng, lat])

    else:
        query += " ORDER BY p.avg_rating DESC, pr.name ASC"

    query += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    cur.execute(query, params)
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]

