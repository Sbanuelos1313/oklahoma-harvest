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

STRIPE_CONNECT_WEBHOOK_SECRET = os.getenv(
    "STRIPE_CONNECT_WEBHOOK_SECRET",
    "",
)

STRIPE_SELLER_PRODUCT_ID = os.getenv(
    "STRIPE_SELLER_PRODUCT_ID",
    "",
)

STRIPE_SELLER_PRICE_ID = os.getenv(
    "STRIPE_SELLER_PRICE_ID",
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
    product_id: int = Field(
        gt=0,
    )

    quantity: int = Field(
        gt=0,
    )


class CreatePaymentIntentRequest(BaseModel):
    producer_id: int = Field(
        gt=0,
    )

    fulfillment_type: str

    items: list[PaymentItem]


# ============================================================
# CREATE PAYMENT INTENT
# ============================================================

@router.post("/create-payment-intent")
def create_payment_intent(
    req: CreatePaymentIntentRequest,
    user=Depends(
        get_current_shopper
    ),
):
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
            detail="Invalid fulfillment type",
        )

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ====================================================
        # PRODUCER
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
                detail="Producer not found",
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
        # FULFILLMENT VALIDATION
        # ====================================================

        if (
            req.fulfillment_type
            == "pickup"
            and not fulfillment_pickup
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Pickup is not available "
                    "for this producer"
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
                    "Delivery is not available "
                    "for this producer"
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
                    "Shipping is not available "
                    "for this producer"
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
                    "Duplicate products in cart"
                ),
            )


        # ====================================================
        # AUTHORITATIVE PRODUCT DATA
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

        product_rows = cur.fetchall()

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
        # AUTHORITATIVE SUBTOTAL
        # ====================================================

        subtotal = 0.0

        for item in req.items:
            product = products_by_id.get(
                item.product_id
            )

            if not product:
                raise HTTPException(
                    status_code=400,
                    detail="Product not found",
                )

            (
                product_id,
                product_producer_id,
                product_price,
                quantity_available,
                product_active,
                is_prohibited,
            ) = product


            if (
                product_producer_id
                != req.producer_id
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "All products must belong "
                        "to the same producer"
                    ),
                )


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


            if (
                item.quantity
                > quantity_available
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Only {quantity_available} "
                        f"units are available for "
                        f"product {product_id}"
                    ),
                )


            subtotal += (
                float(product_price)
                * item.quantity
            )


        # ====================================================
        # AUTHORITATIVE TOTALS
        # ====================================================

        subtotal = round(
            subtotal,
            2,
        )

        tax_rate_value = float(
            tax_rate or 0
        )

        tax = round(
            subtotal * tax_rate_value,
            2,
        )


        if (
            req.fulfillment_type
            == "delivery"
        ):
            delivery_fee_value = round(
                float(
                    delivery_fee or 0
                ),
                2,
            )

        else:
            delivery_fee_value = 0.0


        total = round(
            subtotal
            + tax
            + delivery_fee_value,
            2,
        )

        amount_cents = round(
            total * 100
        )

        # From Our Place marketplace fee:
        # 3% of merchandise subtotal only.
        # Tax and delivery are excluded.
        platform_fee_cents = round(
            subtotal * 100 * 0.03
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
        # STRIPE CUSTOMER
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

        if not shopper:
            raise HTTPException(
                status_code=404,
                detail="Shopper not found",
            )

        stripe_customer_id = (
            shopper[0]
        )

        shopper_email = (
            shopper[1]
            or ""
        )


        if not stripe_customer_id:
            customer = (
                stripe.Customer.create(
                    email=
                        shopper_email,

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
        # ====================================================

        intent_kwargs = {
            "amount":
                amount_cents,

            "currency":
                "usd",

            "customer":
                stripe_customer_id,

            "payment_method_types": [
                "card",
            ],

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

            intent_kwargs[
                "application_fee_amount"
            ] = platform_fee_cents


        # ====================================================
        # CREATE PAYMENT INTENT
        # ====================================================

        intent = (
            stripe.PaymentIntent.create(
                **intent_kwargs
            )
        )


        # ====================================================
        # RETURN AUTHORITATIVE TOTALS
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
                subtotal,

            "tax":
                tax,

            "delivery_fee":
                delivery_fee_value,

            "total":
                total,

            "amount":
                amount_cents,
        }


    except HTTPException:
        conn.rollback()
        raise


    except stripe.error.StripeError as e:
        conn.rollback()

        print(
            "STRIPE PAYMENT INTENT ERROR:",
            e,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to prepare payment"
            ),
        ) from e


    except Exception as e:
        conn.rollback()

        print(
            "PAYMENT INTENT ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to prepare payment"
            ),
        )


    finally:
        cur.close()
        conn.close()


# ============================================================
# SELLER MEMBERSHIP STATUS
# ============================================================

@router.get("/seller-membership/status")
def get_seller_membership_status(
    user=Depends(
        get_current_producer
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                billing_status,
                stripe_customer_id,
                stripe_subscription_id,
                billing_comped_at
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
            billing_status,
            stripe_customer_id,
            stripe_subscription_id,
            billing_comped_at,
        ) = producer

        return {
            "billing_status":
                billing_status,
            "is_entitled":
                billing_status in (
                    "comped",
                    "active",
                ),
            "is_comped":
                billing_status == "comped",
            "has_stripe_customer":
                bool(stripe_customer_id),
            "has_subscription":
                bool(stripe_subscription_id),
            "billing_comped_at":
                (
                    billing_comped_at.isoformat()
                    if billing_comped_at
                    else None
                ),
        }

    finally:
        cur.close()
        conn.close()


# ============================================================
# SELLER MEMBERSHIP PORTAL
# ============================================================

@router.post("/seller-membership/portal")
def create_seller_membership_portal(
    user=Depends(
        get_current_producer
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                billing_status,
                stripe_customer_id
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
            billing_status,
            stripe_customer_id,
        ) = producer


        if billing_status == "comped":
            return {
                "status": "comped",
                "portal_required": False,
            }


        if not stripe_customer_id:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Seller does not have "
                    "a billing account"
                ),
            )


        session = (
            stripe.billing_portal.Session.create(
                customer=stripe_customer_id,
                return_url=(
                    f"{APP_URL}"
                    "/static/producer.html"
                ),
            )
        )

        return {
            "portal_required": True,
            "portal_url": session.url,
        }


    except HTTPException:
        raise


    except stripe.error.StripeError as e:
        print(
            "SELLER BILLING PORTAL ERROR:",
            e,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to open seller "
                "billing portal"
            ),
        ) from e


    finally:
        cur.close()
        conn.close()


# ============================================================
# SELLER MEMBERSHIP CHECKOUT
# ============================================================

@router.post("/seller-membership/checkout")
def create_seller_membership_checkout(
    user=Depends(
        get_current_producer
    ),
):
    if not STRIPE_SELLER_PRICE_ID:
        raise HTTPException(
            status_code=500,
            detail=(
                "Seller membership price "
                "not configured"
            ),
        )

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                p.id,
                p.billing_status,
                p.stripe_customer_id,
                p.stripe_subscription_id,
                u.email
            FROM producers p
            JOIN users u
              ON u.id = p.user_id
            WHERE p.user_id = %s
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
            billing_status,
            stripe_customer_id,
            stripe_subscription_id,
            email,
        ) = producer


        # Permanent founding-seller entitlement.
        if billing_status == "comped":
            return {
                "status": "comped",
                "checkout_required": False,
            }


        # Never create a second subscription.
        if stripe_subscription_id:
            try:
                existing_subscription = (
                    stripe.Subscription.retrieve(
                        stripe_subscription_id
                    )
                )

                existing_status = (
                    existing_subscription.get(
                        "status",
                        "",
                    )
                )

                if existing_status in (
                    "active",
                    "trialing",
                    "past_due",
                    "unpaid",
                    "incomplete",
                    "paused",
                ):
                    return {
                        "status":
                            existing_status,
                        "checkout_required":
                            False,
                        "stripe_subscription_id":
                            stripe_subscription_id,
                    }

            except stripe.error.InvalidRequestError:
                # Stored subscription no longer exists in Stripe.
                # Clear it and allow a fresh checkout.
                cur.execute(
                    """
                    UPDATE producers
                    SET stripe_subscription_id = NULL
                    WHERE id = %s
                    """,
                    (
                        producer_id,
                    ),
                )

                conn.commit()

                stripe_subscription_id = None


        # Reuse the seller's Stripe Customer when possible.
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=email or None,
                metadata={
                    "platform":
                        "from_our_place",
                    "producer_id":
                        str(producer_id),
                    "purpose":
                        "seller_membership",
                },
            )

            stripe_customer_id = customer.id

            cur.execute(
                """
                UPDATE producers
                SET stripe_customer_id = %s
                WHERE id = %s
                  AND billing_status <> 'comped'
                """,
                (
                    stripe_customer_id,
                    producer_id,
                ),
            )

            conn.commit()


        session = (
            stripe.checkout.Session.create(
                mode="subscription",
                customer=stripe_customer_id,
                line_items=[
                    {
                        "price":
                            STRIPE_SELLER_PRICE_ID,
                        "quantity":
                            1,
                    }
                ],
                success_url=(
                    f"{APP_URL}"
                    "/static/producer.html"
                    "?membership=success"
                ),
                cancel_url=(
                    f"{APP_URL}"
                    "/static/producer.html"
                    "?membership=canceled"
                ),
                client_reference_id=(
                    str(producer_id)
                ),
                metadata={
                    "platform":
                        "from_our_place",
                    "producer_id":
                        str(producer_id),
                    "purpose":
                        "seller_membership",
                },
                subscription_data={
                    "metadata": {
                        "platform":
                            "from_our_place",
                        "producer_id":
                            str(producer_id),
                        "purpose":
                            "seller_membership",
                    }
                },
            )
        )

        return {
            "status": billing_status,
            "checkout_required": True,
            "checkout_url": session.url,
        }


    except HTTPException:
        conn.rollback()
        raise


    except stripe.error.StripeError as e:
        conn.rollback()

        print(
            "SELLER MEMBERSHIP STRIPE ERROR:",
            e,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to prepare seller "
                "membership"
            ),
        ) from e


    except Exception as e:
        conn.rollback()

        print(
            "SELLER MEMBERSHIP ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to prepare seller "
                "membership"
            ),
        ) from e


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
    ),
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


        # ====================================================
        # CREATE CONNECT ACCOUNT
        # ====================================================

        if not stripe_acct:
            account = (
                stripe.Account.create(
                    type="standard",

                    metadata={
                        "producer_id":
                            str(
                                producer_id
                            ),
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


        # ====================================================
        # ONBOARDING LINK
        # ====================================================

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


    except HTTPException:
        conn.rollback()
        raise


    except stripe.error.StripeError as e:
        conn.rollback()

        print(
            "STRIPE ONBOARDING ERROR:",
            e,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to start "
                "Stripe onboarding"
            ),
        ) from e


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
    ),
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

            "charges_enabled":
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


        # ====================================================
        # SYNC DATABASE BOTH DIRECTIONS
        # ====================================================

        if (
            complete
            != bool(row[1])
        ):
            conn2 = get_conn()
            cur2 = conn2.cursor()

            try:
                cur2.execute(
                    """
                    UPDATE producers
                    SET stripe_onboarding_complete = %s
                    WHERE user_id = %s
                    """,
                    (
                        complete,
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


    except stripe.error.StripeError as e:
        print(
            "STRIPE STATUS ERROR:",
            e,
        )

        return {
            "connected":
                True,

            "onboarding_complete":
                bool(
                    row[1]
                ),

            "charges_enabled":
                False,
        }


# ============================================================
# FAILED PAYMENT ORDER CLEANUP
# ============================================================

def cancel_pending_orders_for_failed_payment(
    payment_intent_id: str,
    reason: str,
):
    """
    Safely clean up any legacy pending order tied to a failed
    or cancelled Stripe PaymentIntent.

    The current checkout flow creates orders only after payment
    succeeds, so normally there will be no matching pending
    order. This protects legacy or edge-case records.
    """

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ====================================================
        # LOCK MATCHING PENDING ORDERS
        # ====================================================

        cur.execute(
            """
            SELECT id
            FROM orders
            WHERE stripe_payment_intent_id = %s
              AND status = 'pending'
            FOR UPDATE
            """,
            (
                payment_intent_id,
            ),
        )

        order_ids = [
            row[0]
            for row
            in cur.fetchall()
        ]


        for order_id in order_ids:
            # ================================================
            # RESTORE INVENTORY
            # ================================================

            cur.execute(
                """
                SELECT
                    product_id,
                    quantity
                FROM order_items
                WHERE order_id = %s
                """,
                (
                    order_id,
                ),
            )

            items = cur.fetchall()


            for (
                product_id,
                quantity,
            ) in items:
                cur.execute(
                    """
                    UPDATE products
                    SET quantity_available =
                        quantity_available
                        + %s
                    WHERE id = %s
                    """,
                    (
                        quantity,
                        product_id,
                    ),
                )


            # ================================================
            # CANCEL ORDER
            # ================================================

            cur.execute(
                """
                UPDATE orders
                SET
                    status =
                        'cancelled',

                    cancel_reason =
                        %s,

                    cancelled_at =
                        NOW(),

                    updated_at =
                        NOW()

                WHERE id = %s
                  AND status = 'pending'
                """,
                (
                    reason,
                    order_id,
                ),
            )


        conn.commit()


    except Exception:
        conn.rollback()
        raise


    finally:
        cur.close()
        conn.close()


# ============================================================
# STRIPE WEBHOOK
# ============================================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
):
    # ========================================================
    # WEBHOOK CONFIG CHECK
    # ========================================================

    if (
        not STRIPE_WEBHOOK_SECRET
        or not STRIPE_CONNECT_WEBHOOK_SECRET
    ):
        raise HTTPException(
            status_code=500,
            detail=(
                "Stripe webhook secrets "
                "not configured"
            ),
        )


    payload = (
        await request.body()
    )

    signature = (
        request.headers.get(
            "stripe-signature",
            "",
        )
    )


    # ========================================================
    # VERIFY STRIPE SIGNATURE
    # ========================================================

    event = None
    verification_error = None

    for webhook_secret in (
        STRIPE_WEBHOOK_SECRET,
        STRIPE_CONNECT_WEBHOOK_SECRET,
    ):
        try:
            event = (
                stripe.Webhook.construct_event(
                    payload,
                    signature,
                    webhook_secret,
                )
            )

            break

        except Exception as e:
            verification_error = e


    if event is None:
        print(
            "STRIPE WEBHOOK "
            "SIGNATURE ERROR:",
            verification_error,
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid webhook signature"
            ),
        ) from verification_error

    event_type = (
        event["type"]
    )


    # ========================================================
    # CONNECT ACCOUNT UPDATED
    # ========================================================

    if (
        event_type
        == "account.updated"
    ):
        acct = (
            event["data"]["object"]
        )

        complete = bool(
            acct.get(
                "details_submitted"
            )
            and acct.get(
                "charges_enabled"
            )
        )


        conn = get_conn()
        cur = conn.cursor()

        try:
            cur.execute(
                """
                UPDATE producers
                SET stripe_onboarding_complete = %s
                WHERE stripe_account_id = %s
                """,
                (
                    complete,
                    acct["id"],
                ),
            )

            conn.commit()

        except Exception:
            conn.rollback()
            raise

        finally:
            cur.close()
            conn.close()


    # ========================================================
    # SELLER SUBSCRIPTION SYNC
    # ========================================================

    elif event_type in (
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        subscription = (
            event["data"]["object"]
        )

        subscription_id = (
            subscription["id"]
        )

        customer_id = (
            subscription.get("customer")
        )

        metadata = (
            subscription.get("metadata")
            or {}
        )

        producer_id = (
            metadata.get("producer_id")
        )

        stripe_status = (
            subscription.get("status", "")
        )

        # Stripe states mapped to the deliberately small
        # From Our Place seller-billing state machine.
        if (
            event_type
            == "customer.subscription.deleted"
        ):
            billing_status = "canceled"

        elif stripe_status in (
            "active",
            "trialing",
        ):
            billing_status = "active"

        elif stripe_status in (
            "past_due",
            "unpaid",
            "incomplete",
            "incomplete_expired",
            "paused",
        ):
            billing_status = "past_due"

        else:
            billing_status = "canceled"


        conn = get_conn()
        cur = conn.cursor()

        try:
            # Permanent comped sellers must never lose their
            # entitlement because of a Stripe webhook.
            cur.execute(
                """
                UPDATE producers
                SET
                    stripe_customer_id = %s,
                    stripe_subscription_id = %s,
                    billing_status = %s
                WHERE (
                    id = CASE
                        WHEN %s ~ '^[0-9]+$'
                        THEN %s::INTEGER
                        ELSE NULL
                    END
                    OR stripe_customer_id = %s
                    OR stripe_subscription_id = %s
                )
                  AND billing_status <> 'comped'
                """,
                (
                    customer_id,
                    subscription_id,
                    billing_status,
                    producer_id,
                    producer_id,
                    customer_id,
                    subscription_id,
                ),
            )

            conn.commit()

        except Exception:
            conn.rollback()
            raise

        finally:
            cur.close()
            conn.close()


    # ========================================================
    # PAYMENT FAILED
    # ========================================================

    elif (
        event_type
        == "payment_intent.payment_failed"
    ):
        intent = (
            event["data"]["object"]
        )

        cancel_pending_orders_for_failed_payment(
            intent["id"],
            "Payment failed",
        )


    # ========================================================
    # PAYMENT INTENT CANCELLED
    # ========================================================

    elif (
        event_type
        == "payment_intent.canceled"
    ):
        intent = (
            event["data"]["object"]
        )

        cancel_pending_orders_for_failed_payment(
            intent["id"],
            "Payment cancelled",
        )


    # ========================================================
    # SUCCESS
    # ========================================================

    return {
        "received":
            True,
    }