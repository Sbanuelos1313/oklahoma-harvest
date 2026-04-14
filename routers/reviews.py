from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_conn
from auth import get_current_shopper

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

class CreateReviewRequest(BaseModel):
    order_id: int
    rating: int
    comment: str = None

@router.post("/")
def create_review(req: CreateReviewRequest, user=Depends(get_current_shopper)):
    if not (1 <= req.rating <= 5): raise HTTPException(400, "Rating must be between 1 and 5")
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, producer_id, status FROM orders WHERE id = %s AND shopper_id = %s",
                (req.order_id, user["id"]))
    order = cur.fetchone()
    if not order: cur.close(); conn.close(); raise HTTPException(404, "Order not found")
    if order[2] != "fulfilled": cur.close(); conn.close(); raise HTTPException(400, "Can only review fulfilled orders")
    cur.execute("SELECT id FROM reviews WHERE order_id = %s", (req.order_id,))
    if cur.fetchone(): cur.close(); conn.close(); raise HTTPException(400, "Already reviewed")
    producer_id = order[1]
    cur.execute("INSERT INTO reviews (order_id, shopper_id, producer_id, rating, comment) VALUES (%s,%s,%s,%s,%s)",
                (req.order_id, user["id"], producer_id, req.rating, req.comment))
    cur.execute("""
        UPDATE producers SET
            avg_rating = (SELECT AVG(rating) FROM reviews WHERE producer_id = %s),
            review_count = (SELECT COUNT(*) FROM reviews WHERE producer_id = %s)
        WHERE id = %s
    """, (producer_id, producer_id, producer_id))
    conn.commit(); cur.close(); conn.close()
    return {"message": "Review submitted"}

@router.get("/producer/{producer_id}")
def get_producer_reviews(producer_id: int, limit: int = 10):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT r.rating, r.comment, r.created_at, u.full_name
        FROM reviews r JOIN users u ON r.shopper_id = u.id
        WHERE r.producer_id = %s ORDER BY r.created_at DESC LIMIT %s
    """, (producer_id, limit))
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]
