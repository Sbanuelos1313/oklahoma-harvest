from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_conn
from auth import hash_password, verify_password, create_token, get_current_user
import secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/users", tags=["users"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "shopper"
    phone: str = None
    city: str = None
    state: str = "OK"
    zip_code: str = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    full_name: str = None
    phone: str = None
    city: str = None
    state: str = None
    zip_code: str = None
    latitude: float = None
    longitude: float = None
    search_radius_miles: int = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/register")
def register(req: RegisterRequest):
    if req.role not in ("shopper", "producer"):
        raise HTTPException(400, "Role must be shopper or producer")
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (req.email.lower().strip(),))
    if cur.fetchone():
        cur.close(); conn.close()
        raise HTTPException(400, "Email already registered")
    cur.execute("""
        INSERT INTO users (email, password_hash, role, full_name, phone, city, state, zip_code)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id, role
    """, (req.email.lower().strip(), hash_password(req.password), req.role,
          req.full_name, req.phone, req.city, req.state, req.zip_code))
    row = cur.fetchone()
    conn.commit(); cur.close(); conn.close()
    return {"token": create_token(row[0], row[1]), "user_id": row[0], "role": row[1]}

@router.post("/login")
def login(req: LoginRequest):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, password_hash, role, full_name, is_active FROM users WHERE email = %s",
                (req.email.lower().strip(),))
    row = cur.fetchone(); cur.close(); conn.close()
    if not row or not verify_password(req.password, row[1]):
        raise HTTPException(401, "Invalid email or password")
    if not row[4]: raise HTTPException(403, "Account deactivated")
    return {"token": create_token(row[0], row[2]), "user_id": row[0], "role": row[2], "full_name": row[3]}

@router.get("/me")
def get_me(user=Depends(get_current_user)):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        SELECT id, email, role, full_name, phone, city, state, zip_code,
               latitude, longitude, search_radius_miles, created_at
        FROM users WHERE id = %s
    """, (user["id"],))
    row = cur.fetchone(); cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    if not row: raise HTTPException(404, "User not found")
    return dict(zip(cols, row))

@router.patch("/me")
def update_profile(req: UpdateProfileRequest, user=Depends(get_current_user)):
    fields = {k: v for k, v in req.dict().items() if v is not None}
    if not fields: raise HTTPException(400, "No fields to update")
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [user["id"]]
    conn = get_conn(); cur = conn.cursor()
    cur.execute(f"UPDATE users SET {set_clause}, updated_at = NOW() WHERE id = %s", values)
    conn.commit(); cur.close(); conn.close()
    return {"message": "Profile updated"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, full_name, email FROM users WHERE email = %s", (req.email.lower().strip(),))
    user = cur.fetchone()
    if not user:
        cur.close(); conn.close()
        return {"message": "If that email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)
    cur.execute("UPDATE users SET reset_token = %s, reset_token_expires = %s WHERE id = %s", (token, expires, user[0]))
    conn.commit(); cur.close(); conn.close()
    from emails import send_email, base_template
    reset_url = f"https://from-our-place.chronos-ai.net/static/reset.html?token={token}"
    content = f"""
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#2D1A0E;margin:0 0 12px;">Reset your password</h2>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 16px;">Hi {user[1]},</p>
    <p style="font-size:15px;color:#5C4033;line-height:1.7;margin:0 0 20px;">
      We received a request to reset your password. Click below to create a new one. This link expires in 1 hour.
    </p>
    <a href="{reset_url}" style="display:block;background:#4A6741;color:white;text-align:center;padding:13px;border-radius:11px;text-decoration:none;font-size:14px;font-weight:700;">
      Reset My Password →
    </a>
    <p style="font-size:12px;color:#8C6E5A;margin-top:16px;text-align:center;">If you didn't request this, ignore this email.</p>"""
    send_email(user[2], "Reset your From Our Place password", base_template(content))
    return {"message": "If that email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE reset_token = %s AND reset_token_expires > NOW()", (req.token,))
    user = cur.fetchone()
    if not user:
        cur.close(); conn.close()
        raise HTTPException(400, "Invalid or expired reset token")
    from auth import hash_password
    cur.execute("UPDATE users SET password_hash = %s, reset_token = NULL, reset_token_expires = NULL WHERE id = %s", (hash_password(req.new_password), user[0]))
    conn.commit(); cur.close(); conn.close()
    return {"message": "Password reset successfully"}
