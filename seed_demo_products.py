import psycopg2
import bcrypt
import requests
import json

DB = "postgresql://neondb_owner:npg_NR0vHjlZoe5J@ep-soft-frog-an54ody9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
API = "https://from-our-place.chronos-ai.net"

# Login as demo producer
res = requests.post(f"{API}/api/users/login", json={"email": "producer@fromourplace.demo", "password": "Demo2026!"})
data = res.json()
token = data["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("Logged in as demo producer")

# Check if shop exists, create if not
shop_res = requests.get(f"{API}/api/producers/me", headers=headers)
if shop_res.status_code == 404:
    shop = requests.post(f"{API}/api/producers/setup", headers=headers, json={
        "shop_name": "Jody's Local Farm",
        "description": "Fresh, local produce grown with love in Oklahoma. From our place to your table.",
        "city": "Edmond",
        "state": "OK",
        "latitude": 35.6528,
        "longitude": -97.4781,
        "fulfillment_pickup": True,
        "fulfillment_delivery": True,
        "delivery_fee": 5.00,
        "tax_rate": 0.08375
    })
    print("Shop created:", shop.json())

    # Auto-approve via DB
    conn = psycopg2.connect(DB)
    cur = conn.cursor()
    cur.execute("UPDATE producers SET admin_approved = TRUE WHERE user_id = 6")
    conn.commit(); cur.close(); conn.close()
    print("Shop approved!")
else:
    print("Shop already exists")

# Add demo products
products = [
    {"name": "Farm Fresh Eggs", "category": "eggs_dairy", "price": 6.50, "unit": "dozen", "quantity_available": 24, "description": "Free-range, pasture-raised eggs from happy hens."},
    {"name": "Raw Wildflower Honey", "category": "pantry", "price": 12.00, "unit": "jar (8oz)", "quantity_available": 15, "description": "Pure raw honey harvested from local wildflower fields. Unfiltered and unheated."},
    {"name": "Heirloom Tomatoes", "category": "vegetables", "price": 4.50, "unit": "lb", "quantity_available": 30, "description": "A colorful mix of Cherokee Purple, Brandywine, and Green Zebra tomatoes."},
    {"name": "Fresh Sourdough Loaf", "category": "baked", "price": 8.00, "unit": "loaf", "quantity_available": 10, "description": "Naturally leavened sourdough baked fresh every morning. Crispy crust, chewy inside."},
    {"name": "Pasture-Raised Chicken", "category": "meat", "price": 14.00, "unit": "lb", "quantity_available": 20, "description": "Whole pasture-raised chickens. No antibiotics, no hormones — ever."},
    {"name": "Seasonal Herb Bundle", "category": "herbs", "price": 3.50, "unit": "bunch", "quantity_available": 18, "description": "Fresh-cut rosemary, thyme, and basil from the garden. Perfect for cooking."},
    {"name": "Strawberry Jam", "category": "pantry", "price": 7.00, "unit": "jar (12oz)", "quantity_available": 12, "description": "Small-batch strawberry jam made with local berries and cane sugar. No pectin added."},
    {"name": "Sweet Corn", "category": "vegetables", "price": 5.00, "unit": "6 ears", "quantity_available": 40, "description": "Silver Queen sweet corn picked fresh daily. Best corn in Oklahoma."},
]

for p in products:
    res = requests.post(f"{API}/api/products/", headers=headers, json={**p, "tags": []})
    d = res.json()
    if res.ok:
        print(f"Added: {p['name']} (ID:{d['product_id']})")
    else:
        print(f"Failed: {p['name']} - {d}")

print("\nAll done! Demo producer is ready for Jody.")
