from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_conn
from auth import hash_password, verify_password, create_token, get_current_user

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
