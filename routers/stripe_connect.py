from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Request,
)

from pydantic import (
    BaseModel,
    Field,
)

from database import get_conn

from auth import (
    get_current_producer,
    get_current_shopper,
)

import stripe
import os


# ============================================================
# ROUTER / STRIPE CONFIG
# ============================================================

router = APIRouter(
    prefix="/api/stripe",
    tags=["stripe"],
)

stripe.api_key = os.getenv(
    "STRIPE_SECRET_KEY"
)

STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET",
    "",
)

APP_URL = os.getenv(
    "APP_URL",
    "https://from-our-place.chronos-ai.net",
)


# ============================================================
# PUBLISHABLE KEY
# ============================================================

@router.get("/publishable-key")
def get_publishable_key():
    key = os.getenv(
        "STRIPE_PUBLISHABLE_KEY",
        "",
    )

    if not key:
        raise HTTPException(
            status_code=500,
            detail=(
                "Stripe publishable key "
                "not configured"
            ),
        )

    return {
        "key": key,
    }


# ============================================================
# PAYMENT REQUEST MODELS
# ============================================================

class PaymentItem(BaseModel):
    product_id: int

    quantity: int = Field(
        gt=0,
    )


class CreatePaymentIntentRequest(
    BaseModel
):
    producer_id: int

    fulfillment_type: str

    items: list[PaymentItem]


# ============================================================
# CREATE PAYMENT INTENT
#
# IMPORTANT:
# The client does NOT provide:
#
#   - price
#   - subtotal
#   - tax
#   - delivery fee
#   - total
#   - Stripe amount
#
# All monetary values are calculated here from authoritative
# database records.
# ============================================================

@router.post(
    "/create-payment-intent"
)
def create_payment_intent(
    req: CreatePaymentIntentRequest,
    user=Depends(
        get_current_shopper
    ),
):
    # --------------------------------------------------------
    # BASIC REQUEST VALIDATION
    # --------------------------------------------------------

    if not req.items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty",
        )

    allowed_fulfillment = {
        "pickup",
        "delivery",
        "shipping",
    }

    if (
        req.fulfillment_type
        not in allowed_fulfillment
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid fulfillment type"
            ),
        )


    # --------------------------------------------------------
    # DATABASE
    # --------------------------------------------------------

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ====================================================
        # LOAD PRODUCER
        # ====================================================

        cur.execute(
            """
            SELECT
                stripe_account_id,
                admin_approved,
                is_active,
                fulfillment_pickup,
                fulfillment_delivery,
                fulfillment_shipping,
                delivery_fee,
                tax_rate
            FROM producers
            WHERE id = %s
            """,
            (
                req.producer_id,
            ),
        )

        producer = cur.fetchone()

        if not producer:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Producer not found"
                ),
            )

        (
            stripe_account_id,
            admin_approved,
            producer_active,
            fulfillment_pickup,
            fulfillment_delivery,
            fulfillment_shipping,
            delivery_fee,
            tax_rate,
        ) = producer


        # ====================================================
        # PRODUCER AVAILABILITY
        # ====================================================

        if (
            not admin_approved
            or not producer_active
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Producer is not "
                    "currently available"
                ),
            )


        # ====================================================
        # AUTHORITATIVE FULFILLMENT VALIDATION
        # ====================================================

        if (
            req.fulfillment_type
            == "pickup"
            and not fulfillment_pickup
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Pickup is not "
                    "available for this "
                    "producer"
                ),
            )

        if (
            req.fulfillment_type
            == "delivery"
            and not fulfillment_delivery
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Delivery is not "
                    "available for this "
                    "producer"
                ),
            )

        if (
            req.fulfillment_type
            == "shipping"
            and not fulfillment_shipping
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Shipping is not "
                    "available for this "
                    "producer"
                ),
            )


        # ====================================================
        # PRODUCT IDS
        # ====================================================

        product_ids = [
            item.product_id
            for item in req.items
        ]

        if (
            len(product_ids)
            != len(set(product_ids))
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Duplicate products "
                    "in cart"
                ),
            )


        # ====================================================
        # LOAD AUTHORITATIVE PRODUCT DATA
        #
        # NEVER trust prices sent from the client.
        # ====================================================

        placeholders = ", ".join(
            ["%s"] * len(product_ids)
        )

        cur.execute(
            f"""
            SELECT
                id,
                producer_id,
                price,
                quantity_available,
                is_active,
                is_prohibited
            FROM products
            WHERE id IN ({placeholders})
            """,
            product_ids,
        )

        product_rows = (
            cur.fetchall()
        )

        if (
            len(product_rows)
            != len(product_ids)
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "One or more products "
                    "are no longer available"
                ),
            )

        products_by_id = {
            row[0]: row
            for row in product_rows
        }


        # ====================================================
        # CALCULATE AUTHORITATIVE SUBTOTAL
        # ====================================================

        subtotal = 0.0

        for item in req.items:
            product = (
                products_by_id.get(
                    item.product_id
                )
            )

            if not product:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Product not found"
                    ),
                )

            (
                product_id,
                product_producer_id,
                product_price,
                quantity_available,
                product_active,
                is_prohibited,
            ) = product


            # ------------------------------------------------
            # PREVENT MIXED-VENDOR CHECKOUT
            # ------------------------------------------------

            if (
                product_producer_id
                != req.producer_id
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "All products must "
                        "belong to the same "
                        "producer"
                    ),
                )


            # ------------------------------------------------
            # PRODUCT AVAILABILITY
            # ------------------------------------------------

            if (
                not product_active
                or is_prohibited
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "One or more products "
                        "are unavailable"
                    ),
                )


            # ------------------------------------------------
            # INVENTORY VALIDATION
            # ------------------------------------------------

            if (
                item.quantity
                > quantity_available
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Only "
                        f"{quantity_available} "
                        f"units are available "
                        f"for product "
                        f"{product_id}"
                    ),
                )


            # ------------------------------------------------
            # AUTHORITATIVE LINE TOTAL
            # ------------------------------------------------

            subtotal += (
                float(product_price)
                * item.quantity
            )


        # ====================================================
        # AUTHORITATIVE TAX
        # ====================================================

        tax_rate_value = float(
            tax_rate or 0
        )

        tax = (
            subtotal
            * tax_rate_value
        )


        # ====================================================
        # AUTHORITATIVE DELIVERY FEE
        # ====================================================

        if (
            req.fulfillment_type
            == "delivery"
        ):
            delivery_fee_value = float(
                delivery_fee or 0
            )
        else:
            delivery_fee_value = 0.0


        # ====================================================
        # AUTHORITATIVE TOTAL
        # ====================================================

        total = (
            subtotal
            + tax
            + delivery_fee_value
        )


        # ====================================================
        # STRIPE AMOUNT
        #
        # Stripe expects USD in cents.
        # ====================================================

        amount_cents = round(
            total * 100
        )

        if amount_cents <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Order total must be "
                    "greater than zero"
                ),
            )


        # ====================================================
        # SHOPPER / STRIPE CUSTOMER
        # ====================================================

        cur.execute(
            """
            SELECT
                stripe_customer_id,
                email
            FROM users
            WHERE id = %s
            """,
            (
                user["id"],
            ),
        )

        shopper = cur.fetchone()

        stripe_customer_id = (
            shopper[0]
            if shopper
            else None
        )

        shopper_email = (
            shopper[1]
            if shopper
            else ""
        )


        # ====================================================
        # CREATE STRIPE CUSTOMER IF NEEDED
        # ====================================================

        if not stripe_customer_id:
            customer = (
                stripe.Customer.create(
                    email=shopper_email,
                    metadata={
                        "platform":
                            "from_our_place",
                        "shopper_id":
                            str(
                                user["id"]
                            ),
                    },
                )
            )

            stripe_customer_id = (
                customer.id
            )

            cur.execute(
                """
                UPDATE users
                SET stripe_customer_id = %s
                WHERE id = %s
                """,
                (
                    stripe_customer_id,
                    user["id"],
                ),
            )

            conn.commit()


        # ====================================================
        # PAYMENT INTENT
        #
        # IMPORTANT:
        # amount_cents was calculated entirely on the server.
        # ====================================================

        intent_kwargs = {
            "amount":
                amount_cents,

            "currency":
                "usd",

            "customer":
                stripe_customer_id,

            "automatic_payment_methods": {
                "enabled": True,
            },

            "metadata": {
                "platform":
                    "from_our_place",

                "shopper_id":
                    str(
                        user["id"]
                    ),

                "producer_id":
                    str(
                        req.producer_id
                    ),

                "fulfillment_type":
                    req.fulfillment_type,
            },
        }


        # ====================================================
        # STRIPE CONNECT DESTINATION
        # ====================================================

        if stripe_account_id:
            intent_kwargs[
                "transfer_data"
            ] = {
                "destination":
                    stripe_account_id,
            }


        # ====================================================
        # CREATE PAYMENT INTENT
        # ====================================================

        intent = (
            stripe.PaymentIntent.create(
                **intent_kwargs
            )
        )


        # ====================================================
        # RETURN AUTHORITATIVE CHECKOUT DATA
        # ====================================================

        return {
            "client_secret":
                intent.client_secret,

            "payment_intent_id":
                intent.id,

            "stripe_customer_id":
                stripe_customer_id,

            "fulfillment_type":
                req.fulfillment_type,

            "subtotal":
                round(
                    subtotal,
                    2,
                ),

            "tax":
                round(
                    tax,
                    2,
                ),

            "delivery_fee":
                round(
                    delivery_fee_value,
                    2,
                ),

            "total":
                round(
                    total,
                    2,
                ),

            "amount":
                amount_cents,
        }


    finally:
        cur.close()
        conn.close()


# ============================================================
# STRIPE CONNECT ONBOARDING
# ============================================================

@router.post("/connect/onboard")
def start_onboarding(
    user=Depends(
        get_current_producer
    )
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                id,
                stripe_account_id,
                stripe_onboarding_complete
            FROM producers
            WHERE user_id = %s
            """,
            (
                user["id"],
            ),
        )

        producer = cur.fetchone()

        if not producer:
            raise HTTPException(
                status_code=404,
                detail="No shop found",
            )

        (
            producer_id,
            stripe_acct,
            onboarding_done,
        ) = producer


        if onboarding_done:
            return {
                "message":
                    "Already set up",

                "complete":
                    True,
            }


        # ----------------------------------------------------
        # CREATE CONNECT ACCOUNT IF NEEDED
        # ----------------------------------------------------

        if not stripe_acct:
            account = (
                stripe.Account.create(
                    type="standard",

                    metadata={
                        "producer_id":
                            producer_id,
                    },
                )
            )

            stripe_acct = (
                account.id
            )

            cur.execute(
                """
                UPDATE producers
                SET stripe_account_id = %s
                WHERE id = %s
                """,
                (
                    stripe_acct,
                    producer_id,
                ),
            )

            conn.commit()


        # ----------------------------------------------------
        # CREATE ONBOARDING LINK
        # ----------------------------------------------------

        link = (
            stripe.AccountLink.create(
                account=
                    stripe_acct,

                refresh_url=(
                    f"{APP_URL}"
                    "/static/producer.html"
                ),

                return_url=(
                    f"{APP_URL}"
                    "/static/producer.html"
                ),

                type=
                    "account_onboarding",
            )
        )

        return {
            "onboarding_url":
                link.url,

            "complete":
                False,
        }

    finally:
        cur.close()
        conn.close()


# ============================================================
# STRIPE CONNECT STATUS
# ============================================================

@router.get("/connect/status")
def get_connect_status(
    user=Depends(
        get_current_producer
    )
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                stripe_account_id,
                stripe_onboarding_complete
            FROM producers
            WHERE user_id = %s
            """,
            (
                user["id"],
            ),
        )

        row = cur.fetchone()

    finally:
        cur.close()
        conn.close()


    if (
        not row
        or not row[0]
    ):
        return {
            "connected":
                False,

            "onboarding_complete":
                False,
        }


    try:
        acct = (
            stripe.Account.retrieve(
                row[0]
            )
        )

        complete = bool(
            acct.details_submitted
            and acct.charges_enabled
        )


        # ----------------------------------------------------
        # SYNC COMPLETION TO DATABASE
        # ----------------------------------------------------

        if (
            complete
            and not row[1]
        ):
            conn2 = get_conn()
            cur2 = conn2.cursor()

            try:
                cur2.execute(
                    """
                    UPDATE producers
                    SET stripe_onboarding_complete = TRUE
                    WHERE user_id = %s
                    """,
                    (
                        user["id"],
                    ),
                )

                conn2.commit()

            finally:
                cur2.close()
                conn2.close()


        return {
            "connected":
                True,

            "onboarding_complete":
                complete,

            "charges_enabled":
                bool(
                    acct.charges_enabled
                ),
        }

    except stripe.error.StripeError:
        return {
            "connected":
                True,

            "onboarding_complete":
                bool(row[1]),

            "charges_enabled":
                False,
        }


# ============================================================
# STRIPE WEBHOOK
# ============================================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request
):
    payload = (
        await request.body()
    )

    sig = request.headers.get(
        "stripe-signature",
        "",
    )


    # --------------------------------------------------------
    # VERIFY STRIPE SIGNATURE
    # --------------------------------------------------------

    try:
        event = (
            stripe.Webhook
            .construct_event(
                payload,
                sig,
                STRIPE_WEBHOOK_SECRET,
            )
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid webhook "
                "signature"
            ),
        )


    # ========================================================
    # CONNECT ACCOUNT UPDATED
    # ========================================================

    if (
        event["type"]
        == "account.updated"
    ):
        acct = (
            event["data"]["object"]
        )

        if (
            acct.get(
                "charges_enabled"
            )
            and acct.get(
                "details_submitted"
            )
        ):
            conn = get_conn()
            cur = conn.cursor()

            try:
                cur.execute(
                    """
                    UPDATE producers
                    SET stripe_onboarding_complete = TRUE
                    WHERE stripe_account_id = %s
                    """,
                    (
                        acct["id"],
                    ),
                )

                conn.commit()

            finally:
                cur.close()
                conn.close()


    # ========================================================
    # PAYMENT FAILED
    # ========================================================

    elif (
        event["type"]
        == "payment_intent.payment_failed"
    ):
        intent = (
            event["data"]["object"]
        )

        conn = get_conn()
        cur = conn.cursor()

        try:
            cur.execute(
                """
                UPDATE orders
                SET
                    status = 'cancelled',
                    cancel_reason = 'Payment failed',
                    cancelled_at = NOW()
                WHERE stripe_payment_intent_id = %s
                  AND status = 'pending'
                """,
                (
                    intent["id"],
                ),
            )

            conn.commit()

        finally:
            cur.close()
            conn.close()


    return {
        "received": True,
    }