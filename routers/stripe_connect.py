from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from database import get_conn
from auth import get_current_producer, get_current_shopper
import stripe
import os

router = APIRouter(prefix="/api/stripe", tags=["stripe"])
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
APP_URL = os.getenv("APP_URL", "https://from-our-place.chronos-ai.net")

@router.get("/publishable-key")
def get_publishable_key():
    key = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    if not key:
        raise HTTPException(500, "Stripe publishable key not configured")
    return {"key": key}

class CreatePaymentIntentRequest(BaseModel):
    amount: int
    producer_id: int

@router.post("/create-payment-intent")
def create_payment_intent(req: CreatePaymentIntentRequest, user=Depends(get_current_shopper)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT stripe_account_id FROM producers WHERE id = %s AND admin_approved = TRUE", (req.producer_id,))
    producer = cur.fetchone()
    cur.execute("SELECT stripe_customer_id, email FROM users WHERE id = %s", (user["id"],))
    u = cur.fetchone()
    stripe_cid = u[0] if u else None
    if not stripe_cid:
        customer = stripe.Customer.create(email=u[1] if u else "")
        stripe_cid = customer.id
        cur.execute("UPDATE users SET stripe_customer_id = %s WHERE id = %s", (stripe_cid, user["id"]))
        conn.commit()
    cur.close(); conn.close()
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

@router.post("/connect/onboard")
def start_onboarding(user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, stripe_account_id, stripe_onboarding_complete FROM producers WHERE user_id = %s", (user["id"],))
    producer = cur.fetchone()
    if not producer: cur.close(); conn.close(); raise HTTPException(404, "No shop found")
    producer_id, stripe_acct, onboarding_done = producer
    if onboarding_done: cur.close(); conn.close(); return {"message": "Already set up", "complete": True}
    if not stripe_acct:
        account = stripe.Account.create(type="standard", metadata={"producer_id": producer_id})
        stripe_acct = account.id
        cur.execute("UPDATE producers SET stripe_account_id = %s WHERE id = %s", (stripe_acct, producer_id))
        conn.commit()
    link = stripe.AccountLink.create(
        account=stripe_acct,
        refresh_url=f"{APP_URL}/static/producer.html",
        return_url=f"{APP_URL}/static/producer.html",
        type="account_onboarding"
    )
    cur.close(); conn.close()
    return {"onboarding_url": link.url, "complete": False}

@router.get("/connect/status")
def get_connect_status(user=Depends(get_current_producer)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT stripe_account_id, stripe_onboarding_complete FROM producers WHERE user_id = %s", (user["id"],))
    row = cur.fetchone(); cur.close(); conn.close()
    if not row or not row[0]: return {"connected": False, "onboarding_complete": False}
    try:
        acct = stripe.Account.retrieve(row[0])
        complete = acct.details_submitted and acct.charges_enabled
        if complete and not row[1]:
            conn2 = get_conn(); cur2 = conn2.cursor()
            cur2.execute("UPDATE producers SET stripe_onboarding_complete = TRUE WHERE user_id = %s", (user["id"],))
            conn2.commit(); cur2.close(); conn2.close()
        return {"connected": True, "onboarding_complete": complete, "charges_enabled": acct.charges_enabled}
    except Exception:
        return {"connected": True, "onboarding_complete": row[1]}

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Invalid webhook signature")
    if event["type"] == "account.updated":
        acct = event["data"]["object"]
        if acct.get("charges_enabled") and acct.get("details_submitted"):
            conn = get_conn(); cur = conn.cursor()
            cur.execute("UPDATE producers SET stripe_onboarding_complete = TRUE WHERE stripe_account_id = %s", (acct["id"],))
            conn.commit(); cur.close(); conn.close()
    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        conn = get_conn(); cur = conn.cursor()
        cur.execute("UPDATE orders SET status = 'cancelled', cancel_reason = 'Payment failed', cancelled_at = NOW() WHERE stripe_payment_intent_id = %s AND status = 'pending'", (intent["id"],))
        conn.commit(); cur.close(); conn.close()
    return {"received": True}
