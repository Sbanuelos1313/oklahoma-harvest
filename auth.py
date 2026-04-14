import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_conn

SECRET_KEY = os.getenv("JWT_SECRET", "from-our-place-secret-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

def hash_password(password): return pwd_context.hash(password)
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)

def create_token(user_id, role):
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": str(user_id), "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    payload = decode_token(credentials.credentials)
    user_id = int(payload["sub"])
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT id, email, role, full_name, is_active FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone(); cur.close(); conn.close()
    if not row: raise HTTPException(status_code=401, detail="User not found")
    if not row[4]: raise HTTPException(status_code=403, detail="Account deactivated")
    return {"id": row[0], "email": row[1], "role": row[2], "full_name": row[3]}

def get_current_shopper(user=Depends(get_current_user)):
    if user["role"] not in ("shopper", "admin"): raise HTTPException(403, "Shoppers only")
    return user

def get_current_producer(user=Depends(get_current_user)):
    if user["role"] not in ("producer", "admin"): raise HTTPException(403, "Producers only")
    return user

def get_current_admin(user=Depends(get_current_user)):
    if user["role"] != "admin": raise HTTPException(403, "Admins only")
    return user
