from fastapi import APIRouter, HTTPException, Depends, Request
from database import get_conn
from auth import get_current_producer
import stripe
import os

router = APIRouter(prefix="/api/stripe", tags=["stripe"])
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
APP_URL = os.getenv("APP_URL", "https://from-our-place-api.onrender.com")

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
        refresh_url=f"{APP_URL}/producer/stripe/refresh",
        return_url=f"{APP_URL}/producer/stripe/complete",
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
