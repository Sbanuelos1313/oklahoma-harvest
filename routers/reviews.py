from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)

from pydantic import (
    BaseModel,
    Field,
)

from typing import Optional

from database import get_conn

from auth import (
    get_current_shopper,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/reviews",
    tags=["reviews"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class CreateReviewRequest(BaseModel):
    order_id: int = Field(
        gt=0,
    )

    rating: int = Field(
        ge=1,
        le=5,
    )

    comment: Optional[str] = Field(
        default=None,
        max_length=2000,
    )


# ============================================================
# CREATE REVIEW
# ============================================================

@router.post("/")
def create_review(
    req: CreateReviewRequest,
    user=Depends(
        get_current_shopper
    ),
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        # ----------------------------------------------------
        # LOAD + LOCK ORDER
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT
                id,
                producer_id,
                status
            FROM orders
            WHERE id = %s
              AND shopper_id = %s
            FOR UPDATE
            """,
            (
                req.order_id,
                user["id"],
            ),
        )

        order = cur.fetchone()

        if not order:
            raise HTTPException(
                status_code=404,
                detail="Order not found",
            )

        (
            order_id,
            producer_id,
            order_status,
        ) = order


        # ----------------------------------------------------
        # ONLY FULFILLED ORDERS CAN BE REVIEWED
        # ----------------------------------------------------

        if order_status != "fulfilled":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Can only review "
                    "fulfilled orders"
                ),
            )


        # ----------------------------------------------------
        # PREVENT DUPLICATE REVIEW
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id
            FROM reviews
            WHERE order_id = %s
            LIMIT 1
            """,
            (
                req.order_id,
            ),
        )

        if cur.fetchone():
            raise HTTPException(
                status_code=409,
                detail=(
                    "Order has already "
                    "been reviewed"
                ),
            )


        # ----------------------------------------------------
        # CLEAN COMMENT
        # ----------------------------------------------------

        comment = (
            req.comment.strip()
            if req.comment
            else None
        )

        if comment == "":
            comment = None


        # ----------------------------------------------------
        # CREATE REVIEW
        # ----------------------------------------------------

        cur.execute(
            """
            INSERT INTO reviews (
                order_id,
                shopper_id,
                producer_id,
                rating,
                comment
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s
            )
            RETURNING id
            """,
            (
                order_id,
                user["id"],
                producer_id,
                req.rating,
                comment,
            ),
        )

        review_id = (
            cur.fetchone()[0]
        )


        # ----------------------------------------------------
        # RECALCULATE PRODUCER RATING
        # ----------------------------------------------------

        cur.execute(
            """
            UPDATE producers
            SET
                avg_rating = (
                    SELECT
                        COALESCE(
                            AVG(rating),
                            0
                        )
                    FROM reviews
                    WHERE producer_id = %s
                ),

                review_count = (
                    SELECT
                        COUNT(*)
                    FROM reviews
                    WHERE producer_id = %s
                ),

                updated_at = NOW()

            WHERE id = %s
            """,
            (
                producer_id,
                producer_id,
                producer_id,
            ),
        )

        conn.commit()


        # ----------------------------------------------------
        # RETURN UPDATED SUMMARY
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT
                avg_rating,
                review_count
            FROM producers
            WHERE id = %s
            """,
            (
                producer_id,
            ),
        )

        rating_summary = (
            cur.fetchone()
        )


        return {
            "message":
                "Review submitted",

            "review_id":
                review_id,

            "producer_id":
                producer_id,

            "avg_rating":
                (
                    float(
                        rating_summary[0]
                    )
                    if rating_summary
                    and rating_summary[0]
                    is not None
                    else 0.0
                ),

            "review_count":
                (
                    rating_summary[1]
                    if rating_summary
                    else 0
                ),
        }


    except HTTPException:
        conn.rollback()
        raise


    except Exception as e:
        conn.rollback()

        print(
            "CREATE REVIEW ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to submit review"
            ),
        )


    finally:
        cur.close()
        conn.close()


# ============================================================
# GET PRODUCER REVIEWS
# ============================================================

@router.get(
    "/producer/{producer_id}"
)
def get_producer_reviews(
    producer_id: int,
    limit: int = 10,
):
    if producer_id < 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid producer ID"
            ),
        )

    if limit < 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Limit must be at least 1"
            ),
        )

    if limit > 100:
        limit = 100


    conn = get_conn()
    cur = conn.cursor()

    try:
        # ----------------------------------------------------
        # VERIFY PRODUCER IS PUBLICLY AVAILABLE
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

        if not cur.fetchone():
            raise HTTPException(
                status_code=404,
                detail=(
                    "Producer not found"
                ),
            )


        # ----------------------------------------------------
        # LOAD REVIEWS
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                u.full_name
                    AS shopper_name
            FROM reviews r
            JOIN users u
              ON r.shopper_id = u.id
            WHERE r.producer_id = %s
            ORDER BY
                r.created_at DESC
            LIMIT %s
            """,
            (
                producer_id,
                limit,
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


    except HTTPException:
        raise


    except Exception as e:
        print(
            "GET PRODUCER REVIEWS ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load reviews"
            ),
        )


    finally:
        cur.close()
        conn.close()