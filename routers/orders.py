from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)

from pydantic import (
    BaseModel,
    Field,
)

from typing import (
    List,
    Optional,
)

from datetime import (
    datetime,
    timedelta,
)

from database import get_conn

from auth import (
    get_current_user,
    get_current_shopper,
    get_current_producer,
)

import stripe
import os
import threading


# ============================================================
# CONFIG
# ============================================================

router = APIRouter(
    prefix="/api/orders",
    tags=["orders"],
)

stripe.api_key = os.getenv(
    "STRIPE_SECRET_KEY"
)

PLATFORM_FEE = 0

AUTO_CANCEL_HOURS = 12


# ============================================================
# REQUEST MODELS
# ============================================================

class OrderItem(BaseModel):
    product_id: int

    quantity: int = Field(
        gt=0,
    )


class UpdateOrderStatusRequest(BaseModel):
    status: str

    cancel_reason: Optional[str] = None


class PlaceOrderFromPaymentRequest(BaseModel):
    producer_id: int

    items: List[OrderItem]

    fulfillment_type: str

    delivery_address: Optional[str] = None

    pickup_notes: Optional[str] = None

    payment_intent_id: str


# ============================================================
# ORDER STATUS TRANSITIONS
# ============================================================

VALID_TRANSITIONS = {
    "pending": [
        "confirmed",
        "cancelled",
    ],

    "confirmed": [
        "ready_for_pickup",
        "out_for_delivery",
        "cancelled",
    ],

    "ready_for_pickup": [
        "fulfilled",
    ],

    "out_for_delivery": [
        "fulfilled",
    ],
}


# ============================================================
# EMAIL HELPER
# ============================================================

def send_email_async(
    fn,
    *args,
    **kwargs,
):
    """
    Run email sending in a background thread.
    """

    def run():
        try:
            fn(
                *args,
                **kwargs,
            )

        except Exception as e:
            print(
                f"Email error: {e}"
            )

    threading.Thread(
        target=run,
        daemon=True,
    ).start()


# ============================================================
# LEGACY CHECKOUT ENDPOINT
# ============================================================

@router.post("/")
def place_order_legacy(
    user=Depends(
        get_current_shopper
    ),
):
    """
    Legacy direct-payment checkout has been retired.

    Shopper checkout must now use:

        POST /api/stripe/create-payment-intent

    followed by:

        POST /api/orders/from-payment
    """

    raise HTTPException(
        status_code=410,
        detail=(
            "This checkout endpoint has been retired. "
            "Please use the current payment flow."
        ),
    )


# ============================================================
# SHOPPER ORDERS
# ============================================================

@router.get("/my")
def get_my_orders(
    user=Depends(
        get_current_shopper
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                o.id,
                o.status,
                o.fulfillment_type,
                o.subtotal,
                o.tax_amount,
                o.delivery_fee,
                o.total,
                o.created_at,
                o.respond_by_at,
                p.shop_name,
                p.city
            FROM orders o
            JOIN producers p
              ON o.producer_id = p.id
            WHERE o.shopper_id = %s
            ORDER BY o.created_at DESC
            """,
            (
                user["id"],
            ),
        )

        rows = cur.fetchall()

        cols = [
            description[0]
            for description
            in cur.description
        ]

        return [
            dict(
                zip(
                    cols,
                    row,
                )
            )
            for row in rows
        ]

    finally:
        cur.close()
        conn.close()


# ============================================================
# PRODUCER INCOMING ORDERS
# ============================================================

@router.get(
    "/producer/incoming"
)
def get_producer_orders(
    user=Depends(
        get_current_producer
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT id
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

        cur.execute(
            """
            SELECT
                o.id,
                o.status,
                o.fulfillment_type,
                o.total,
                o.created_at,
                o.respond_by_at,
                o.delivery_address,
                o.cancel_reason,
                o.cancelled_at,
                u.full_name
                    AS shopper_name,
                EXTRACT(
                    EPOCH FROM (
                        o.respond_by_at
                        - NOW()
                    )
                ) / 3600
                    AS hours_remaining
            FROM orders o
            JOIN users u
              ON o.shopper_id = u.id
            WHERE o.producer_id = %s
            ORDER BY
                CASE o.status
                    WHEN 'pending'
                        THEN 1
                    WHEN 'confirmed'
                        THEN 2
                    ELSE 3
                END,
                o.created_at DESC
            LIMIT 50
            """,
            (
                producer[0],
            ),
        )

        rows = cur.fetchall()

        cols = [
            description[0]
            for description
            in cur.description
        ]

        return [
            dict(
                zip(
                    cols,
                    row,
                )
            )
            for row in rows
        ]

    finally:
        cur.close()
        conn.close()


# ============================================================
# ORDER DETAIL
# ============================================================

@router.get("/{order_id}")
def get_order(
    order_id: int,
    user=Depends(
        get_current_user
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                o.*,
                p.shop_name,
                p.city,
                p.state,
                u.full_name
                    AS shopper_name,
                u.email
                    AS shopper_email
            FROM orders o
            JOIN producers p
              ON o.producer_id = p.id
            JOIN users u
              ON o.shopper_id = u.id
            WHERE o.id = %s
            """,
            (
                order_id,
            ),
        )

        order = cur.fetchone()

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        cols = [
            description[0]
            for description
            in cur.description
        ]

        order_dict = dict(
            zip(
                cols,
                order,
            )
        )


        # --------------------------------------------------------
        # ACCESS CONTROL
        # --------------------------------------------------------

        if (
            user["role"] == "shopper"
            and order_dict["shopper_id"]
            != user["id"]
        ):
            raise HTTPException(
                status_code=403,
                detail="Not your order",
            )


        if user["role"] == "producer":
            cur.execute(
                """
                SELECT id
                FROM producers
                WHERE user_id = %s
                """,
                (
                    user["id"],
                ),
            )

            producer = cur.fetchone()

            if (
                not producer
                or order_dict["producer_id"]
                != producer[0]
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Not your order",
                )


        # --------------------------------------------------------
        # ORDER ITEMS
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT
                product_name,
                product_unit,
                quantity,
                unit_price,
                subtotal
            FROM order_items
            WHERE order_id = %s
            """,
            (
                order_id,
            ),
        )

        items = cur.fetchall()

        item_cols = [
            description[0]
            for description
            in cur.description
        ]

        order_dict["items"] = [
            dict(
                zip(
                    item_cols,
                    item,
                )
            )
            for item in items
        ]

        return order_dict

    finally:
        cur.close()
        conn.close()


# ============================================================
# UPDATE ORDER STATUS
# ============================================================

@router.patch(
    "/{order_id}/status"
)
def update_order_status(
    order_id: int,
    req: UpdateOrderStatusRequest,
    user=Depends(
        get_current_user
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    shopper_info = None
    producer_info = None

    try:
        # ====================================================
        # LOCK ORDER
        # ====================================================

        cur.execute(
            """
            SELECT
                o.status,
                o.shopper_id,
                o.producer_id,
                o.stripe_payment_intent_id,
                o.total,
                o.fulfillment_type
            FROM orders o
            WHERE o.id = %s
            FOR UPDATE
            """,
            (
                order_id,
            ),
        )

        order = cur.fetchone()

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        (
            current_status,
            shopper_id,
            producer_id,
            intent_id,
            total,
            fulfillment_type,
        ) = order


        # ====================================================
        # PREVENT REPEATED CANCELLATION
        # ====================================================

        if (
            current_status
            in (
                "cancelled",
                "auto_cancelled",
            )
            and req.status
            in (
                "cancelled",
                "auto_cancelled",
            )
        ):
            return {
                "message":
                    "Order is already cancelled",

                "order_id":
                    order_id,

                "status":
                    current_status,
            }


        # ====================================================
        # AUTHORIZATION
        # ====================================================

        if user["role"] == "producer":
            cur.execute(
                """
                SELECT id
                FROM producers
                WHERE user_id = %s
                """,
                (
                    user["id"],
                ),
            )

            producer = cur.fetchone()

            if (
                not producer
                or producer[0]
                != producer_id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Not your order",
                )

        elif user["role"] == "shopper":
            if (
                shopper_id
                != user["id"]
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Not your order",
                )

            # Shoppers may cancel their own order only
            # while it is still awaiting producer confirmation.
            if req.status == "cancelled":
                if current_status != "pending":
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "This order can no longer be "
                            "cancelled because the producer "
                            "has already confirmed it."
                        ),
                    )

            elif req.status == "fulfilled":
                pass

            else:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        "Shoppers can only cancel a pending "
                        "order or mark an eligible order "
                        "fulfilled."
                    ),
                )

        # ====================================================
        # VALIDATE TRANSITION
        # ====================================================

        allowed = (
            VALID_TRANSITIONS.get(
                current_status,
                [],
            )
        )

        if (
            req.status
            not in allowed
            and user["role"]
            != "admin"
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot move from "
                    f"'{current_status}' "
                    f"to '{req.status}'"
                ),
            )


        # ====================================================
        # CANCELLATION
        # ====================================================

        is_cancellation = (
            req.status
            in (
                "cancelled",
                "auto_cancelled",
            )
        )


        # ====================================================
        # REFUND FIRST
        # ====================================================

        if (
            is_cancellation
            and intent_id
        ):
            try:
                stripe.Refund.create(
                    payment_intent=
                        intent_id,

                    reason=
                        "requested_by_customer",

                    metadata={
                        "order_id":
                            str(
                                order_id
                            ),

                        "platform":
                            "from_our_place",
                    },

                    idempotency_key=(
                        f"order-refund-"
                        f"{order_id}"
                    ),
                )

            except stripe.error.StripeError as e:
                conn.rollback()

                raise HTTPException(
                    status_code=502,
                    detail=(
                        "The order was not "
                        "cancelled because the "
                        "refund could not be "
                        "submitted. Please try "
                        "again."
                    ),
                ) from e


        # ====================================================
        # RESTORE INVENTORY
        # ====================================================

        if is_cancellation:
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

            order_items = (
                cur.fetchall()
            )

            for (
                product_id,
                quantity,
            ) in order_items:
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


        # ====================================================
        # TIMESTAMP FIELD
        # ====================================================

        timestamp_field = {
            "confirmed":
                "confirmed_at",

            "fulfilled":
                "fulfilled_at",

            "cancelled":
                "cancelled_at",

            "auto_cancelled":
                "cancelled_at",

            "ready_for_pickup":
                "ready_at",
        }.get(
            req.status
        )


        # ====================================================
        # UPDATE ORDER
        # ====================================================

        set_clause = (
            "status = %s, "
            "updated_at = NOW()"
        )

        params = [
            req.status,
        ]


        if timestamp_field:
            set_clause += (
                f", {timestamp_field} "
                "= NOW()"
            )


        if (
            req.cancel_reason
            and is_cancellation
        ):
            set_clause += (
                ", cancel_reason = %s"
            )

            params.append(
                req.cancel_reason
            )


        params.append(
            order_id
        )


        cur.execute(
            f"""
            UPDATE orders
            SET {set_clause}
            WHERE id = %s
            """,
            params,
        )


        # ====================================================
        # SHOPPER INFO
        # ====================================================

        cur.execute(
            """
            SELECT
                email,
                full_name
            FROM users
            WHERE id = %s
            """,
            (
                shopper_id,
            ),
        )

        shopper_info = (
            cur.fetchone()
        )


        # ====================================================
        # PRODUCER INFO
        # ====================================================

        cur.execute(
            """
            SELECT
                u.email,
                p.shop_name
            FROM producers p
            JOIN users u
              ON p.user_id = u.id
            WHERE p.id = %s
            """,
            (
                producer_id,
            ),
        )

        producer_info = (
            cur.fetchone()
        )


        # ====================================================
        # SHOPPER NOTIFICATION
        # ====================================================

        notification_map = {
            "confirmed": (
                "Order Confirmed",
                (
                    f"Order #{order_id} "
                    "was confirmed."
                ),
            ),

            "ready_for_pickup": (
                "Ready for Pickup!",
                (
                    f"Order #{order_id} "
                    "is ready for pickup."
                ),
            ),

            "out_for_delivery": (
                "On Its Way!",
                (
                    f"Order #{order_id} "
                    "is out for delivery."
                ),
            ),

            "fulfilled": (
                "Order Complete",
                (
                    f"Order #{order_id} "
                    "was completed. "
                    "You can now leave "
                    "a review."
                ),
            ),

            "cancelled": (
                "Order Cancelled",
                (
                    f"Order #{order_id} "
                    "was cancelled and "
                    "the refund was "
                    "submitted."
                ),
            ),

            "auto_cancelled": (
                "Order Auto-Cancelled",
                (
                    f"Order #{order_id} "
                    "was not confirmed "
                    "in time. The refund "
                    "was submitted."
                ),
            ),
        }


        if (
            req.status
            in notification_map
        ):
            (
                title,
                body,
            ) = notification_map[
                req.status
            ]

            cur.execute(
                """
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    body,
                    order_id
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    shopper_id,
                    req.status,
                    title,
                    body,
                    order_id,
                ),
            )


        conn.commit()


    except HTTPException:
        conn.rollback()
        raise


    except Exception as e:
        conn.rollback()

        print(
            "ORDER STATUS ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to update "
                "order status"
            ),
        )


    finally:
        cur.close()
        conn.close()


    # ========================================================
    # EMAILS AFTER COMMIT
    # ========================================================

    if (
        shopper_info
        and producer_info
    ):
        (
            shopper_email,
            shopper_name,
        ) = shopper_info

        (
            _producer_email,
            shop_name,
        ) = producer_info

        try:
            from emails import (
                email_order_confirmed,
                email_order_ready,
                email_order_cancelled,
            )


            if (
                req.status
                == "confirmed"
            ):
                send_email_async(
                    email_order_confirmed,
                    shopper_email,
                    shopper_name,
                    shop_name,
                    order_id,
                    fulfillment_type,
                    float(total),
                )


            elif req.status in (
                "ready_for_pickup",
                "out_for_delivery",
            ):
                send_email_async(
                    email_order_ready,
                    shopper_email,
                    shopper_name,
                    shop_name,
                    order_id,
                    fulfillment_type,
                )


            elif (
                req.status
                == "cancelled"
            ):
                send_email_async(
                    email_order_cancelled,
                    shopper_email,
                    shopper_name,
                    shop_name,
                    order_id,
                    float(total),
                    auto=False,
                )


            elif (
                req.status
                == "auto_cancelled"
            ):
                send_email_async(
                    email_order_cancelled,
                    shopper_email,
                    shopper_name,
                    shop_name,
                    order_id,
                    float(total),
                    auto=True,
                )


        except Exception as e:
            print(
                "EMAIL DISPATCH ERROR:",
                e,
            )


    return {
        "message": (
            f"Order status updated "
            f"to {req.status}"
        ),

        "order_id":
            order_id,

        "status":
            req.status,
    }


# ============================================================
# AUTO CANCEL EXPIRED ORDERS
# ============================================================

def run_auto_cancel():
    """
    Automatically cancel pending orders whose producer
    response window has expired.

    Each order is processed independently so one failed
    refund does not prevent other expired orders from
    being processed.
    """

    conn = get_conn()
    cur = conn.cursor()

    processed = 0
    failed = 0

    try:
        cur.execute(
            """
            SELECT
                id
            FROM orders
            WHERE status = 'pending'
              AND respond_by_at < NOW()
            ORDER BY respond_by_at ASC
            """
        )

        expired_ids = [
            row[0]
            for row
            in cur.fetchall()
        ]

    finally:
        cur.close()
        conn.close()


    for order_id in expired_ids:
        conn = get_conn()
        cur = conn.cursor()

        shopper = None
        producer = None

        try:
            # =================================================
            # LOCK + RECHECK
            # =================================================

            cur.execute(
                """
                SELECT
                    status,
                    stripe_payment_intent_id,
                    shopper_id,
                    producer_id,
                    total,
                    fulfillment_type
                FROM orders
                WHERE id = %s
                FOR UPDATE
                """,
                (
                    order_id,
                ),
            )

            order = cur.fetchone()

            if not order:
                conn.rollback()
                continue


            (
                status,
                intent_id,
                shopper_id,
                producer_id,
                total,
                fulfillment_type,
            ) = order


            if status != "pending":
                conn.rollback()
                continue


            # =================================================
            # REFUND
            # =================================================

            if intent_id:
                try:
                    stripe.Refund.create(
                        payment_intent=
                            intent_id,

                        reason=
                            "requested_by_customer",

                        metadata={
                            "order_id":
                                str(
                                    order_id
                                ),

                            "platform":
                                "from_our_place",

                            "auto_cancel":
                                "true",
                        },

                        idempotency_key=(
                            f"order-refund-"
                            f"{order_id}"
                        ),
                    )

                except stripe.error.StripeError as e:
                    conn.rollback()

                    failed += 1

                    print(
                        "AUTO-CANCEL REFUND "
                        f"FAILED FOR ORDER "
                        f"{order_id}: {e}"
                    )

                    continue


            # =================================================
            # RESTORE INVENTORY
            # =================================================

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


            # =================================================
            # UPDATE ORDER
            # =================================================

            cur.execute(
                """
                UPDATE orders
                SET
                    status =
                        'auto_cancelled',

                    cancelled_at =
                        NOW(),

                    cancel_reason =
                        'Producer did not respond within 12 hours',

                    updated_at =
                        NOW()

                WHERE id = %s
                  AND status = 'pending'
                """,
                (
                    order_id,
                ),
            )


            # =================================================
            # SHOPPER NOTIFICATION
            # =================================================

            cur.execute(
                """
                INSERT INTO notifications (
                    user_id,
                    type,
                    title,
                    body,
                    order_id
                )
                VALUES (
                    %s,
                    'auto_cancelled',
                    'Order Auto-Cancelled',
                    %s,
                    %s
                )
                """,
                (
                    shopper_id,

                    (
                        f"Order #{order_id} "
                        "was not confirmed "
                        "within 12 hours. "
                        "The refund was "
                        "submitted."
                    ),

                    order_id,
                ),
            )


            # =================================================
            # SHOPPER EMAIL DATA
            # =================================================

            cur.execute(
                """
                SELECT
                    email,
                    full_name
                FROM users
                WHERE id = %s
                """,
                (
                    shopper_id,
                ),
            )

            shopper = cur.fetchone()


            # =================================================
            # PRODUCER EMAIL DATA
            # =================================================

            cur.execute(
                """
                SELECT
                    shop_name
                FROM producers
                WHERE id = %s
                """,
                (
                    producer_id,
                ),
            )

            producer = cur.fetchone()


            conn.commit()

            processed += 1


            # =================================================
            # EMAIL AFTER COMMIT
            # =================================================

            if (
                shopper
                and producer
            ):
                try:
                    from emails import (
                        email_order_cancelled,
                    )

                    send_email_async(
                        email_order_cancelled,
                        shopper[0],
                        shopper[1],
                        producer[0],
                        order_id,
                        float(total),
                        auto=True,
                    )

                except Exception as e:
                    print(
                        "AUTO-CANCEL EMAIL "
                        f"ERROR FOR ORDER "
                        f"{order_id}: {e}"
                    )


        except Exception as e:
            conn.rollback()

            failed += 1

            print(
                "AUTO-CANCEL ERROR FOR "
                f"ORDER {order_id}: {e}"
            )


        finally:
            cur.close()
            conn.close()


    print(
        "Auto-cancel: "
        f"processed {processed}, "
        f"failed {failed}"
    )


# ============================================================
# PLACE ORDER FROM CONFIRMED STRIPE PAYMENT
# ============================================================

@router.post("/from-payment")
def place_order_from_payment(
    req: PlaceOrderFromPaymentRequest,
    user=Depends(
        get_current_shopper
    ),
):
    """
    Create an order only after independently verifying
    the Stripe PaymentIntent and recalculating the order
    from authoritative database data.
    """

    # ========================================================
    # BASIC REQUEST VALIDATION
    # ========================================================

    if not req.items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty",
        )


    if req.fulfillment_type not in (
        "pickup",
        "delivery",
        "shipping",
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "fulfillment_type must be "
                "pickup, delivery, or shipping"
            ),
        )


    if (
        req.fulfillment_type
        in ("delivery", "shipping")
        and not req.delivery_address
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "delivery_address required "
                "for delivery or shipping"
            ),
        )


    # ========================================================
    # VERIFY PAYMENT WITH STRIPE
    # ========================================================

    try:
        intent = (
            stripe.PaymentIntent.retrieve(
                req.payment_intent_id
            )
        )

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=402,
            detail=(
                "Payment verification "
                f"failed: {str(e)}"
            ),
        ) from e


    if intent.status not in (
        "succeeded",
        "requires_capture",
    ):
        raise HTTPException(
            status_code=402,
            detail=(
                "Payment not confirmed: "
                f"{intent.status}"
            ),
        )


    # ========================================================
    # VERIFY STRIPE METADATA
    # ========================================================

    metadata = (
        intent.metadata
        or {}
    )


    intent_shopper_id = str(
        metadata.get(
            "shopper_id",
            "",
        )
    )


    intent_producer_id = str(
        metadata.get(
            "producer_id",
            "",
        )
    )


    intent_fulfillment = str(
        metadata.get(
            "fulfillment_type",
            "",
        )
    )


    if (
        intent_shopper_id
        != str(
            user["id"]
        )
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Payment does not belong "
                "to this shopper"
            ),
        )


    if (
        intent_producer_id
        != str(
            req.producer_id
        )
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment producer does not "
                "match order producer"
            ),
        )


    if (
        intent_fulfillment
        and intent_fulfillment
        != req.fulfillment_type
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Payment fulfillment method "
                "does not match order"
            ),
        )


    # ========================================================
    # DATABASE
    # ========================================================

    conn = get_conn()
    cur = conn.cursor()

    prod_info = None

    try:
        # ====================================================
        # DUPLICATE PAYMENT PROTECTION
        # ====================================================

        cur.execute(
            """
            SELECT id
            FROM orders
            WHERE stripe_payment_intent_id = %s
            LIMIT 1
            """,
            (
                req.payment_intent_id,
            ),
        )

        existing_order = (
            cur.fetchone()
        )

        if existing_order:
            raise HTTPException(
                status_code=409,
                detail=(
                    "An order already exists "
                    "for this payment"
                ),
            )


        # ====================================================
        # PRODUCER + FULFILLMENT
        # ====================================================

        cur.execute(
            """
            SELECT
                id,
                tax_rate,
                delivery_fee,
                fulfillment_pickup,
                fulfillment_delivery,
                fulfillment_shipping
            FROM producers
            WHERE id = %s
              AND is_active = TRUE
              AND admin_approved = TRUE
            FOR UPDATE
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
            _producer_id,
            tax_rate,
            delivery_fee,
            fulfillment_pickup,
            fulfillment_delivery,
            fulfillment_shipping,
        ) = producer


        if (
            req.fulfillment_type
            == "pickup"
            and not fulfillment_pickup
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Producer does not "
                    "offer pickup"
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
                    "Producer does not "
                    "offer delivery"
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
                    "Producer does not "
                    "offer shipping"
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
            != len(
                set(
                    product_ids
                )
            )
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Duplicate products "
                    "in cart"
                ),
            )


        # ====================================================
        # LOAD + LOCK PRODUCTS
        # ====================================================

        placeholders = ", ".join(
            ["%s"]
            * len(product_ids)
        )


        cur.execute(
            f"""
            SELECT
                id,
                name,
                unit,
                price,
                quantity_available,
                producer_id,
                is_active,
                is_prohibited
            FROM products
            WHERE id IN ({placeholders})
            FOR UPDATE
            """,
            product_ids,
        )


        rows = cur.fetchall()


        if (
            len(rows)
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
            for row in rows
        }


        # ====================================================
        # AUTHORITATIVE PRICING + INVENTORY
        # ====================================================

        subtotal = 0.0

        items_to_insert = []


        for item in req.items:
            product = (
                products_by_id.get(
                    item.product_id
                )
            )


            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Product "
                        f"{item.product_id} "
                        "not found"
                    ),
                )


            (
                product_id,
                product_name,
                product_unit,
                product_price,
                product_quantity,
                product_producer_id,
                product_active,
                product_prohibited,
            ) = product


            if (
                product_producer_id
                != req.producer_id
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Product "
                        f"'{product_name}' "
                        "is from a different "
                        "producer"
                    ),
                )


            if (
                not product_active
                or product_prohibited
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Product "
                        f"'{product_name}' "
                        "is not available"
                    ),
                )


            if (
                product_quantity
                < item.quantity
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Only "
                        f"{product_quantity} "
                        f"of '{product_name}' "
                        "available"
                    ),
                )


            line_total = round(
                float(
                    product_price
                )
                * item.quantity,
                2,
            )


            subtotal += (
                line_total
            )


            items_to_insert.append(
                (
                    product_id,
                    product_name,
                    product_unit,
                    item.quantity,
                    product_price,
                    line_total,
                )
            )


        # ====================================================
        # AUTHORITATIVE TOTALS
        # ====================================================

        subtotal = round(
            subtotal,
            2,
        )


        tax_rate_value = float(
            tax_rate
            or 0
        )


        tax_amount = round(
            subtotal
            * tax_rate_value,
            2,
        )


        if (
            req.fulfillment_type
            == "delivery"
        ):
            delivery_fee_value = round(
                float(
                    delivery_fee
                    or 0
                ),
                2,
            )

        else:
            delivery_fee_value = 0.0


        total = round(
            subtotal
            + tax_amount
            + delivery_fee_value,
            2,
        )


        expected_amount_cents = round(
            total * 100
        )


        # ====================================================
        # VERIFY STRIPE AMOUNT + CURRENCY
        # ====================================================

        stripe_amount = int(
            intent.amount
        )


        if (
            stripe_amount
            != expected_amount_cents
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Payment amount does "
                    "not match the current "
                    "order total"
                ),
            )


        if (
            str(
                intent.currency
            ).lower()
            != "usd"
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid payment "
                    "currency"
                ),
            )


        # ====================================================
        # CREATE ORDER
        # ====================================================

        respond_by = (
            datetime.utcnow()
            + timedelta(
                hours=
                    AUTO_CANCEL_HOURS
            )
        )


        cur.execute(
            """
            INSERT INTO orders (
                shopper_id,
                producer_id,
                status,
                fulfillment_type,
                subtotal,
                tax_amount,
                delivery_fee,
                total,
                stripe_payment_intent_id,
                respond_by_at,
                pickup_notes,
                delivery_address
            )
            VALUES (
                %s,
                %s,
                'pending',
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            RETURNING id
            """,
            (
                user["id"],
                req.producer_id,
                req.fulfillment_type,
                subtotal,
                tax_amount,
                delivery_fee_value,
                total,
                req.payment_intent_id,
                respond_by,
                req.pickup_notes,
                req.delivery_address,
            ),
        )


        order_id = (
            cur.fetchone()[0]
        )


        # ====================================================
        # ORDER ITEMS + INVENTORY
        # ====================================================

        for (
            product_id,
            product_name,
            product_unit,
            quantity,
            price,
            line_total,
        ) in items_to_insert:

            cur.execute(
                """
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name,
                    product_unit,
                    quantity,
                    unit_price,
                    subtotal
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    order_id,
                    product_id,
                    product_name,
                    product_unit,
                    quantity,
                    price,
                    line_total,
                ),
            )


            cur.execute(
                """
                UPDATE products
                SET quantity_available =
                    quantity_available
                    - %s
                WHERE id = %s
                """,
                (
                    quantity,
                    product_id,
                ),
            )


        # ====================================================
        # PRODUCER INFO
        # ====================================================

        cur.execute(
            """
            SELECT
                u.email,
                u.full_name,
                p.shop_name
            FROM producers p
            JOIN users u
              ON p.user_id = u.id
            WHERE p.id = %s
            """,
            (
                req.producer_id,
            ),
        )


        prod_info = (
            cur.fetchone()
        )


        # ====================================================
        # PRODUCER NOTIFICATION
        # ====================================================

        cur.execute(
            """
            INSERT INTO notifications (
                user_id,
                type,
                title,
                body,
                order_id
            )
            SELECT
                u.id,
                'order_placed',
                'New Order Received',
                'Order #' || %s ||
                ' — respond within 12 hours',
                %s
            FROM producers p
            JOIN users u
              ON p.user_id = u.id
            WHERE p.id = %s
            """,
            (
                order_id,
                order_id,
                req.producer_id,
            ),
        )


        conn.commit()


    except HTTPException:
        conn.rollback()
        raise


    except Exception as e:
        conn.rollback()

        print(
            "ORDER CREATION ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create order"
            ),
        )


    finally:
        cur.close()
        conn.close()


    # ========================================================
    # PRODUCER EMAIL AFTER COMMIT
    # ========================================================

    if prod_info:
        (
            producer_email,
            producer_name,
            shop_name,
        ) = prod_info


        items_text = "<br>".join(
            [
                (
                    f"{item[3]}x "
                    f"{item[1]} — "
                    f"${item[5]:.2f}"
                )
                for item
                in items_to_insert
            ]
        )


        try:
            from emails import (
                email_new_order,
            )


            send_email_async(
                email_new_order,
                producer_email,
                producer_name,
                shop_name,
                order_id,
                user["full_name"],
                items_text,
                total,
                req.fulfillment_type,
            )


        except Exception as e:
            print(
                "ORDER EMAIL ERROR:",
                e,
            )


    # ========================================================
    # SUCCESS
    # ========================================================

    return {
        "order_id":
            order_id,

        "subtotal":
            subtotal,

        "tax":
            tax_amount,

        "delivery_fee":
            delivery_fee_value,

        "total":
            total,

        "fulfillment_type":
            req.fulfillment_type,

        "status":
            "pending",

        "respond_by":
            respond_by.isoformat(),

        "message": (
            "Order placed — producer "
            "has 12 hours to confirm"
        ),
    }