from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from database import init_db
from routers import users, producers, products, orders, reviews, saved, stripe_connect

async def auto_cancel_scheduler():
    from routers.orders import run_auto_cancel
    await asyncio.sleep(10)
    while True:
        try:
            run_auto_cancel()
        except Exception as e:
            print(f"Auto-cancel scheduler error: {e}")
        await asyncio.sleep(15 * 60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🌾 From Our Place API starting up...")
    init_db()
    asyncio.create_task(auto_cancel_scheduler())
    print("✅ Database ready · Auto-cancel scheduler running")
    yield
    print("🌾 From Our Place API shutting down")

app = FastAPI(
    title="From Our Place API",
    description="Farm-to-table marketplace connecting local producers with shoppers",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(producers.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(saved.router)
app.include_router(stripe_connect.router)

if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_landing():
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "From Our Place API", "version": "1.0.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "ok", "app": "from-our-place"}

@app.get("/debug-auth")
def debug_auth():
    import bcrypt
    test = bcrypt.checkpw(b"ChronosAI2026!", bcrypt.hashpw(b"ChronosAI2026!", bcrypt.gensalt()))
    return {"backend": "bcrypt", "test": test}

@app.get("/api")
def api_summary():
    return {
        "endpoints": {
            "auth":     ["POST /api/users/register", "POST /api/users/login", "GET /api/users/me"],
            "producers":["POST /api/producers/setup", "GET /api/producers/nearby", "GET /api/producers/{id}"],
            "products": ["POST /api/products/", "GET /api/products/search", "GET /api/products/my"],
            "orders":   ["POST /api/orders/", "GET /api/orders/my", "PATCH /api/orders/{id}/status"],
            "stripe":   ["POST /api/stripe/connect/onboard", "GET /api/stripe/connect/status"],
            "reviews":  ["POST /api/reviews/", "GET /api/reviews/producer/{id}"],
            "saved":    ["POST /api/saved/{producer_id}", "GET /api/saved/"],
        }
    }
