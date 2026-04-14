from fastapi import APIRouter, HTTPException, Depends
from database import get_conn
from auth import get_current_shopper

router = APIRouter(prefix="/api/saved", tags=["saved"])

@router.post("/{producer_id}")
def save_producer(producer_id: int, user=Depends(get_current_shopper)):
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute("INSERT INTO saved_producers (shopper_id, producer_id) VALUES (%s,%s)",
                    (user["id"], producer_id))
        conn.commit()
    except Exception:
        conn.rollback(); raise HTTPException(400, "Already saved")
    finally:
        cur.close(); conn.close()
    return {"message": "Producer saved"}

@router.delete("/{producer_id}")
def unsave_producer(producer_id: int, user=Depends(get_current_shopper)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("DELETE FROM saved_producers WHERE shopper_id = %s AND producer_id = %s",
                (user["id"], producer_id))
    conn.commit(); cur.close(); conn.close()
    return {"message": "Removed from saved"}

@router.get("/")
def get_saved_producers(user=Depends(get_current_shopper)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT p.id, p.shop_name, p.city, p.state, p.avg_rating, p.review_count,
               p.fulfillment_pickup, p.fulfillment_delivery, p.fulfillment_shipping
        FROM saved_producers sp JOIN producers p ON sp.producer_id = p.id
        WHERE sp.shopper_id = %s AND p.is_active = TRUE ORDER BY sp.created_at DESC
    """, (user["id"],))
    rows = cur.fetchall(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return [dict(zip(cols, r)) for r in rows]
