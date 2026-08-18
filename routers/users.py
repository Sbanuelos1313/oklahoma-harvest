from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)

from database import get_conn

from auth import (
    hash_password,
    verify_password,
    create_token,
    get_current_user,
)

import secrets

from datetime import (
    datetime,
    timedelta,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class RegisterRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    full_name: str = Field(
        min_length=1,
        max_length=200,
    )

    role: str = "shopper"

    phone: str | None = None

    city: str | None = None

    state: str = Field(
        default="OK",
        min_length=2,
        max_length=50,
    )

    zip_code: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr

    password: str


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    phone: str | None = None

    city: str | None = None

    state: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    zip_code: str | None = None

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    search_radius_miles: int | None = Field(
        default=None,
        ge=1,
        le=500,
    )


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(
        min_length=20,
        max_length=500,
    )

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )


# ============================================================
# REGISTER
# ============================================================

@router.post("/register")
def register(
    req: RegisterRequest,
):
    email = str(
        req.email
    ).lower().strip()

    if req.role not in (
        "shopper",
        "producer",
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be "
                "shopper or producer"
            ),
        )

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ----------------------------------------------------
        # CHECK EXISTING EMAIL
        # ----------------------------------------------------

        cur.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            """,
            (
                email,
            ),
        )

        if cur.fetchone():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Email already registered"
                ),
            )


        # ----------------------------------------------------
        # CREATE USER
        # ----------------------------------------------------

        cur.execute(
            """
            INSERT INTO users (
                email,
                password_hash,
                role,
                full_name,
                phone,
                city,
                state,
                zip_code
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            RETURNING
                id,
                role
            """,
            (
                email,
                hash_password(
                    req.password
                ),
                req.role,
                req.full_name.strip(),
                req.phone,
                req.city,
                req.state,
                req.zip_code,
            ),
        )

        row = cur.fetchone()

        conn.commit()

        return {
            "token":
                create_token(
                    row[0],
                    row[1],
                ),

            "user_id":
                row[0],

            "role":
                row[1],
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        print(
            "USER REGISTRATION ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create account"
            ),
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    req: LoginRequest,
):
    email = str(
        req.email
    ).lower().strip()

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                id,
                password_hash,
                role,
                full_name,
                is_active
            FROM users
            WHERE email = %s
            """,
            (
                email,
            ),
        )

        row = cur.fetchone()

    finally:
        cur.close()
        conn.close()


    if (
        not row
        or not verify_password(
            req.password,
            row[1],
        )
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )


    if not row[4]:
        raise HTTPException(
            status_code=403,
            detail=(
                "Account deactivated"
            ),
        )


    return {
        "token":
            create_token(
                row[0],
                row[2],
            ),

        "user_id":
            row[0],

        "role":
            row[2],

        "full_name":
            row[3],
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def get_me(
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
                id,
                email,
                role,
                full_name,
                phone,
                city,
                state,
                zip_code,
                latitude,
                longitude,
                search_radius_miles,
                created_at
            FROM users
            WHERE id = %s
            """,
            (
                user["id"],
            ),
        )

        row = cur.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        cols = [
            description[0]
            for description
            in cur.description
        ]

        return dict(
            zip(
                cols,
                row,
            )
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# UPDATE PROFILE
# ============================================================

@router.patch("/me")
def update_profile(
    req: UpdateProfileRequest,
    user=Depends(
        get_current_user
    ),
):
    fields = {
        key: value
        for key, value
        in req.model_dump().items()
        if value is not None
    }

    if not fields:
        raise HTTPException(
            status_code=400,
            detail=(
                "No fields to update"
            ),
        )


    # Clean up a few common text values before storage.

    if (
        "full_name"
        in fields
        and isinstance(
            fields["full_name"],
            str,
        )
    ):
        fields["full_name"] = (
            fields["full_name"]
            .strip()
        )


    if (
        "state"
        in fields
        and isinstance(
            fields["state"],
            str,
        )
    ):
        fields["state"] = (
            fields["state"]
            .strip()
        )


    set_clause = ", ".join(
        f"{key} = %s"
        for key
        in fields
    )

    values = (
        list(
            fields.values()
        )
        + [
            user["id"],
        ]
    )


    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            f"""
            UPDATE users
            SET
                {set_clause},
                updated_at = NOW()
            WHERE id = %s
            """,
            values,
        )

        conn.commit()

        return {
            "message":
                "Profile updated"
        }

    except Exception as e:
        conn.rollback()

        print(
            "PROFILE UPDATE ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to update profile"
            ),
        )

    finally:
        cur.close()
        conn.close()


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password"
)
def forgot_password(
    req: ForgotPasswordRequest,
):
    email = str(
        req.email
    ).lower().strip()

    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                id,
                full_name,
                email
            FROM users
            WHERE email = %s
              AND is_active = TRUE
            """,
            (
                email,
            ),
        )

        user = cur.fetchone()


        # Do not reveal whether the email exists.

        if not user:
            return {
                "message": (
                    "If that email exists, "
                    "a reset link has been sent."
                )
            }


        token = (
            secrets.token_urlsafe(
                32
            )
        )

        expires = (
            datetime.utcnow()
            + timedelta(
                hours=1
            )
        )


        cur.execute(
            """
            UPDATE users
            SET
                reset_token = %s,
                reset_token_expires = %s,
                updated_at = NOW()
            WHERE id = %s
            """,
            (
                token,
                expires,
                user[0],
            ),
        )

        conn.commit()

    except Exception as e:
        conn.rollback()

        print(
            "PASSWORD RESET REQUEST ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to process "
                "password reset request"
            ),
        )

    finally:
        cur.close()
        conn.close()


    # --------------------------------------------------------
    # SEND EMAIL AFTER DATABASE COMMIT
    # --------------------------------------------------------

    try:
        from emails import (
            send_email,
            base_template,
        )

        reset_url = (
            "https://from-our-place."
            "chronos-ai.net/"
            "static/reset.html"
            f"?token={token}"
        )


        content = f"""
        <h2
            style="
                font-family:Georgia,serif;
                font-size:22px;
                color:#2D1A0E;
                margin:0 0 12px;
            "
        >
            Reset your password
        </h2>

        <p
            style="
                font-size:15px;
                color:#5C4033;
                line-height:1.7;
                margin:0 0 16px;
            "
        >
            Hi {user[1]},
        </p>

        <p
            style="
                font-size:15px;
                color:#5C4033;
                line-height:1.7;
                margin:0 0 20px;
            "
        >
            We received a request to reset
            your password. Click below to
            create a new one. This link
            expires in 1 hour.
        </p>

        <a
            href="{reset_url}"
            style="
                display:block;
                background:#4A6741;
                color:white;
                text-align:center;
                padding:13px;
                border-radius:11px;
                text-decoration:none;
                font-size:14px;
                font-weight:700;
            "
        >
            Reset My Password →
        </a>

        <p
            style="
                font-size:12px;
                color:#8C6E5A;
                margin-top:16px;
                text-align:center;
            "
        >
            If you didn't request this,
            you can safely ignore this email.
        </p>
        """


        send_email(
            user[2],
            (
                "Reset your From Our Place "
                "password"
            ),
            base_template(
                content
            ),
        )

    except Exception as e:
        print(
            "PASSWORD RESET EMAIL ERROR:",
            e,
        )


    return {
        "message": (
            "If that email exists, "
            "a reset link has been sent."
        )
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/reset-password"
)
def reset_password(
    req: ResetPasswordRequest,
):
    conn = get_conn()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT id
            FROM users
            WHERE reset_token = %s
              AND reset_token_expires
                  > NOW()
              AND is_active = TRUE
            FOR UPDATE
            """,
            (
                req.token,
            ),
        )

        user = cur.fetchone()


        if not user:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid or expired "
                    "reset token"
                ),
            )


        cur.execute(
            """
            UPDATE users
            SET
                password_hash = %s,
                reset_token = NULL,
                reset_token_expires = NULL,
                updated_at = NOW()
            WHERE id = %s
            """,
            (
                hash_password(
                    req.new_password
                ),
                user[0],
            ),
        )

        conn.commit()

        return {
            "message": (
                "Password reset successfully"
            )
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()

        print(
            "PASSWORD RESET ERROR:",
            e,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to reset password"
            ),
        )

    finally:
        cur.close()
        conn.close()