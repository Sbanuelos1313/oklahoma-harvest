from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)

from database import get_conn

from auth import (
    get_current_shopper,
)

from psycopg2.errors import (
    UniqueViolation,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/saved",
    tags=["saved"],
)


# ============================================================
# SAVE PRODUCER
# ============================================================

@router.post("/{producer_id}")
def save_producer(
    producer_id: int,
    user=Depends(
        get_current_shopper
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        # ----------------------------------------------------
        # VERIFY PRODUCER IS AVAILABLE
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id
            FROM producers
            WHERE id = %s
              AND is_active = TRUE
              AND admin_approved = TRUE
            """,
            (
                producer_id,
            ),
        )

        producer = cur.fetchone()

        if not producer:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Producer not found "
                    "or is not currently available"
                ),
            )


        # ----------------------------------------------------
        # SAVE PRODUCER
        # ----------------------------------------------------

        cur.execute(
            """
            INSERT INTO saved_producers (
                shopper_id,
                producer_id
            )
            VALUES (
                %s,
                %s
            )
            """,
            (
                user["id"],
                producer_id,
            ),
        )

        conn.commit()

        return {
            "message":
                "Producer saved",

            "producer_id":
                producer_id,

            "saved":
                True,
        }


    except UniqueViolation:
        conn.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Producer is already saved"
            ),
        )


    except HTTPException:
        conn.rollback()
        raise


    except Exception as e:
        conn.rollback()

        print(
            "SAVE PRODUCER ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to save producer"
            ),
        )


    finally:
        cur.close()
        conn.close()


# ============================================================
# UNSAVE PRODUCER
# ============================================================

@router.delete("/{producer_id}")
def unsave_producer(
    producer_id: int,
    user=Depends(
        get_current_shopper
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            DELETE FROM saved_producers
            WHERE shopper_id = %s
              AND producer_id = %s
            RETURNING id
            """,
            (
                user["id"],
                producer_id,
            ),
        )

        removed = cur.fetchone()

        conn.commit()


        # Treat removal as idempotent.
        # If it was already removed, the desired state
        # is still achieved.

        return {
            "message":
                (
                    "Removed from saved"
                    if removed
                    else "Producer was not saved"
                ),

            "producer_id":
                producer_id,

            "saved":
                False,
        }


    except Exception as e:
        conn.rollback()

        print(
            "UNSAVE PRODUCER ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to remove "
                "saved producer"
            ),
        )


    finally:
        cur.close()
        conn.close()


# ============================================================
# GET SAVED PRODUCERS
# ============================================================

@router.get("/")
def get_saved_producers(
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
                p.id,
                p.shop_name,
                p.city,
                p.state,
                p.avg_rating,
                p.review_count,
                p.fulfillment_pickup,
                p.fulfillment_delivery,
                p.fulfillment_shipping
            FROM saved_producers sp
            JOIN producers p
              ON sp.producer_id = p.id
            WHERE sp.shopper_id = %s
              AND p.is_active = TRUE
              AND p.admin_approved = TRUE
            ORDER BY sp.created_at DESC
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


    except Exception as e:
        print(
            "GET SAVED PRODUCERS ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load "
                "saved producers"
            ),
        )


    finally:
        cur.close()
        conn.close()