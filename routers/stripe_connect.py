

# ── PUBLISHABLE KEY ────────────────────────────────────────────────────────

@router.get("/publishable-key")
def get_publishable_key():
    key = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    if not key:
        raise HTTPException(500, "Stripe publishable key not configured")
    return {"key": key}


# ── CREATE PAYMENT INTENT ──────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel as PM

class CreatePaymentIntentRequest(PM):
    amount: int   # cents
    producer_id: int

@router.post("/create-payment-intent")
def create_payment_intent(req: CreatePaymentIntentRequest, user=Depends(get_current_shopper)):
    from database import get_conn
    conn = get_conn(); cur = conn.cursor()

    # Get producer stripe account
    cur.execute("SELECT stripe_account_id FROM producers WHERE id = %s AND admin_approved = TRUE", (req.producer_id,))
    producer = cur.fetchone()

    # Get or create customer
    cur.execute("SELECT stripe_customer_id, email FROM users WHERE id = %s", (user["id"],))
    u = cur.fetchone()
    cur.close(); conn.close()

    stripe_cid = u[0] if u else None
    if not stripe_cid:
        customer = stripe.Customer.create(email=u[1] if u else user["email"])
        stripe_cid = customer.id
        conn2 = get_conn(); cur2 = conn2.cursor()
        cur2.execute("UPDATE users SET stripe_customer_id = %s WHERE id = %s", (stripe_cid, user["id"]))
        conn2.commit(); cur2.close(); conn2.close()

    intent_kwargs = {
        "amount": req.amount,
        "currency": "usd",
        "customer": stripe_cid,
        "automatic_payment_methods": {"enabled": True},
        "metadata": {"platform": "from_our_place", "shopper_id": user["id"], "producer_id": req.producer_id}
    }

    if producer and producer[0]:
        intent_kwargs["transfer_data"] = {"destination": producer[0]}

    intent = stripe.PaymentIntent.create(**intent_kwargs)
    return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
