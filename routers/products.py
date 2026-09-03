from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional
from database import get_conn
from auth import get_current_producer

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
    tags=["products"],
)


PROHIBITED_KEYWORDS = [
    "cannabis",
    "hemp",
    "cbd",
    "thc",
    "delta",
    "delta-8",
    "delta-9",
    "marijuana",
    "weed",
    "edible",
    "infused",
    "420",
    "dispensary",
]

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

VALID_SORTS = {
    "rating",
    "price_low",
    "price_high",
    "newest",
    "alphabetical",
    "distance",
}


def check_prohibited(name: str, description: str = "") -> bool:
    text = f"{name or ''} {description or ''}".lower()
    return any(keyword in text for keyword in PROHIBITED_KEYWORDS)


class CreateProductRequest(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=200,
    )

    description: Optional[str] = None

    category: str

    price: float = Field(
        gt=0,
    )

    unit: str = Field(
        min_length=1,
        max_length=100,
    )

    quantity_available: int = Field(
        default=0,
        ge=0,
    )

    image_url: Optional[str] = None

    tags: List[str] = Field(
        default_factory=list,
    )


class UpdateProductRequest(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: Optional[str] = None

    category: Optional[str] = None

    price: Optional[float] = Field(
        default=None,
        gt=0,
    )

    unit: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    quantity_available: Optional[int] = Field(
        default=None,
        ge=0,
    )

    image_url: Optional[str] = None

    tags: Optional[List[str]] = None

    is_active: Optional[bool] = None

@router.post("/")
def create_product(
    req: CreateProductRequest,
    user=Depends(get_current_producer),
):
    if req.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid category. Must be one of: "
                + ", ".join(VALID_CATEGORIES)
            ),
        )

    if check_prohibited(req.name, req.description or ""):
        raise HTTPException(
            status_code=400,
            detail=(
                "Prohibited item keywords detected "
                "(cannabis/hemp/CBD/THC/Delta not allowed)"
            ),
        )

    if req.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than 0",
        )

    if req.quantity_available < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity cannot be negative",
        )

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id FROM producers WHERE user_id = %s",
            (user["id"],),
        )
        producer = cur.fetchone()

        if not producer:
            raise HTTPException(
                status_code=403,
                detail="Complete shop setup first",
            )

        cur.execute(
            """
            INSERT INTO products (
                producer_id,
                name,
                description,
                category,
                price,
                unit,
                quantity_available,
                image_url,
                tags
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
            """,
            (
                producer[0],
                req.name.strip(),
                req.description,
                req.category,
                req.price,
                req.unit,
                req.quantity_available,
                req.image_url,
                req.tags,
            ),
        )

        product_id = cur.fetchone()[0]
        conn.commit()

        return {
            "product_id": product_id,
            "message": "Product created",
        }

    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


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
        print("Product image upload error:", str(exc))
        raise HTTPException(
            status_code=500,
            detail="Unable to upload product image",
        )


@router.get("/my")
def get_my_products(
    user=Depends(get_current_producer),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            "SELECT id FROM producers WHERE user_id = %s",
            (user["id"],),
        )
        producer = cur.fetchone()

        if not producer:
            raise HTTPException(
                status_code=404,
                detail="No shop found",
            )

        cur.execute(
            """
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
            """,
            (producer[0],),
        )

        rows = cur.fetchall()
        cols = [description[0] for description in cur.description]

        return [dict(zip(cols, row)) for row in rows]

    finally:
        cur.close()
        conn.close()


@router.patch("/{product_id}")
def update_product(
    product_id: int,
    req: UpdateProductRequest,
    user=Depends(get_current_producer),
):
    if req.category is not None and req.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid category. Must be one of: "
                + ", ".join(VALID_CATEGORIES)
            ),
        )

    if req.price is not None and req.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than 0",
        )

    if req.quantity_available is not None and req.quantity_available < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity cannot be negative",
        )


    fields = {
        key: value
        for key, value in req.model_dump().items()
        if value is not None
    }

    if not fields:
        raise HTTPException(
            status_code=400,
            detail="No fields to update",
        )

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                pr.id,
                pr.name,
                pr.description
            FROM products pr
            JOIN producers p
            ON pr.producer_id = p.id
            WHERE pr.id = %s
            AND p.user_id = %s
            """,
            (
                product_id,
                user["id"],
            ),
        )

        existing_product = cur.fetchone()

        if not existing_product:
            raise HTTPException(
                status_code=403,
                detail="Product not found or not yours",
            )

        if not cur.fetchone():
            raise HTTPException(
                status_code=403,
                detail="Product not found or not yours",
            )

        existing_id, existing_name, existing_description = (
            existing_product
        )

        final_name = (
            req.name
            if req.name is not None
            else existing_name
        )

        final_description = (
            req.description
            if req.description is not None
            else existing_description
        )

        if check_prohibited(
            final_name or "",
            final_description or "",
        ):
            raise HTTPException(
                status_code=400,
                detail="Prohibited item keywords detected",
            )

        set_clause = ", ".join(
            f"{key} = %s"
            for key in fields
        )
        values = list(fields.values()) + [product_id]

        cur.execute(
            f"""
            UPDATE products
            SET {set_clause}, updated_at = NOW()
            WHERE id = %s
            """,
            values,
        )

        conn.commit()
        return {"message": "Product updated"}

    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    user=Depends(get_current_producer),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            DELETE FROM products
            USING producers
            WHERE products.id = %s
              AND products.producer_id = producers.id
              AND producers.user_id = %s
            RETURNING products.id
            """,
            (product_id, user["id"]),
        )

        if not cur.fetchone():
            conn.rollback()
            raise HTTPException(
                status_code=403,
                detail="Not found or not yours",
            )

        conn.commit()
        return {"message": "Product deleted"}

    finally:
        cur.close()
        conn.close()


@router.get("/producer/{producer_id}")
def get_producer_products(
    producer_id: int,
    category: str = None,
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        query = """
            SELECT
                id,
                name,
                description,
                category,
                price,
                unit,
                quantity_available,
                image_url,
                tags
            FROM products
            WHERE producer_id = %s
              AND is_active = TRUE
              AND quantity_available > 0
              AND COALESCE(is_prohibited, FALSE) = FALSE
        """
        params = [producer_id]

        if category:
            query += " AND category = %s"
            params.append(category)

        query += " ORDER BY category, name"

        cur.execute(query, params)
        rows = cur.fetchall()
        cols = [description[0] for description in cur.description]

        return [dict(zip(cols, row)) for row in rows]

    finally:
        cur.close()
        conn.close()


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
    offset: int = 0,
):
    if radius_miles <= 0:
        raise HTTPException(
            status_code=400,
            detail="radius_miles must be greater than 0",
        )

    if min_price is not None and min_price < 0:
        raise HTTPException(
            status_code=400,
            detail="min_price cannot be negative",
        )

    if max_price is not None and max_price < 0:
        raise HTTPException(
            status_code=400,
            detail="max_price cannot be negative",
        )

    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=400,
            detail="min_price cannot be greater than max_price",
        )

    if sort_by not in VALID_SORTS:
        raise HTTPException(
            status_code=400,
            detail=(
                "sort_by must be one of: "
                + ", ".join(sorted(VALID_SORTS))
            ),
        )

    if limit < 1:
        raise HTTPException(
            status_code=400,
            detail="limit must be at least 1",
        )

    if limit > 100:
        limit = 100

    if offset < 0:
        raise HTTPException(
            status_code=400,
            detail="offset cannot be negative",
        )

    has_location = lat is not None and lng is not None

    if sort_by == "distance" and not has_location:
        raise HTTPException(
            status_code=400,
            detail="lat and lng are required when sort_by=distance",
        )

    conn = get_conn()
    cur = conn.cursor()

    try:
        query = """
            SELECT
                pr.id,
                pr.name,
                pr.description,
                pr.category,
                pr.price,
                pr.unit,
                pr.quantity_available,
                pr.image_url,
                pr.tags,
                p.id AS producer_id,
                p.shop_name,
                p.city,
                p.state,
                p.fulfillment_pickup,
                p.fulfillment_delivery,
                p.fulfillment_shipping,
                p.avg_rating
            FROM products pr
            JOIN producers p ON pr.producer_id = p.id
            WHERE pr.is_active = TRUE
              AND pr.quantity_available > 0
              AND COALESCE(pr.is_prohibited, FALSE) = FALSE
              AND p.admin_approved = TRUE
              AND p.is_active = TRUE
        """

        params = []

        if q:
            search_term = f"%{q.strip()}%"
            query += """
                AND (
                    pr.name ILIKE %s
                    OR pr.description ILIKE %s
                    OR pr.tags::text ILIKE %s
                    OR p.shop_name ILIKE %s
                )
            """
            params.extend(
                [
                    search_term,
                    search_term,
                    search_term,
                    search_term,
                ]
            )

        if category == "honey_jams":
            query += " AND pr.category IN (%s, %s)"
            params.extend(["honey", "jams"])

        elif category:
            query += " AND pr.category = %s"
            params.append(category)
        if min_price is not None:
            query += " AND pr.price >= %s"
            params.append(min_price)

        if max_price is not None:
            query += " AND pr.price <= %s"
            params.append(max_price)

        if pickup is True:
            query += " AND p.fulfillment_pickup = TRUE"

        if delivery is True:
            query += " AND p.fulfillment_delivery = TRUE"

        if shipping is True:
            query += " AND p.fulfillment_shipping = TRUE"

        if has_location:
            # Producers without coordinates are excluded only when the shopper
            # explicitly performs a location-based search.
            query += """
                AND p.latitude IS NOT NULL
                AND p.longitude IS NOT NULL
                AND (
                    3959 * acos(
                        LEAST(
                            1.0,
                            GREATEST(
                                -1.0,
                                cos(radians(%s)) *
                                cos(radians(p.latitude)) *
                                cos(radians(p.longitude) - radians(%s)) +
                                sin(radians(%s)) *
                                sin(radians(p.latitude))
                            )
                        )
                    )
                ) <= %s
            """
            params.extend(
                [
                    lat,
                    lng,
                    lat,
                    radius_miles,
                ]
            )

        if sort_by == "price_low":
            query += " ORDER BY pr.price ASC, pr.name ASC"

        elif sort_by == "price_high":
            query += " ORDER BY pr.price DESC, pr.name ASC"

        elif sort_by == "newest":
            query += " ORDER BY pr.created_at DESC, pr.name ASC"

        elif sort_by == "alphabetical":
            query += " ORDER BY pr.name ASC"

        elif sort_by == "distance":
            query += """
                ORDER BY (
                    3959 * acos(
                        LEAST(
                            1.0,
                            GREATEST(
                                -1.0,
                                cos(radians(%s)) *
                                cos(radians(p.latitude)) *
                                cos(radians(p.longitude) - radians(%s)) +
                                sin(radians(%s)) *
                                sin(radians(p.latitude))
                            )
                        )
                    )
                ) ASC,
                pr.name ASC
            """
            params.extend([lat, lng, lat])

        else:
            query += """
                ORDER BY
                    p.avg_rating DESC NULLS LAST,
                    pr.name ASC
            """

        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()
        cols = [description[0] for description in cur.description]

        return [dict(zip(cols, row)) for row in rows]

    finally:
        cur.close()
        conn.close()