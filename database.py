import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_conn():
    return psycopg2.connect(DATABASE_URL)

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT '"'"'shopper'"'"',
            full_name TEXT, phone TEXT, city TEXT, state TEXT DEFAULT '"'"'OK'"'"',
            zip_code TEXT, latitude FLOAT, longitude FLOAT,
            search_radius_miles INTEGER DEFAULT 25,
            stripe_customer_id TEXT, push_token TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS producers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            shop_name TEXT NOT NULL, description TEXT, bio TEXT,
            profile_image_url TEXT, address TEXT, city TEXT,
            state TEXT DEFAULT '"'"'OK'"'"', zip_code TEXT,
            latitude FLOAT, longitude FLOAT,
            service_radius_miles INTEGER DEFAULT 25,
            fulfillment_pickup BOOLEAN DEFAULT TRUE,
            fulfillment_delivery BOOLEAN DEFAULT FALSE,
            fulfillment_shipping BOOLEAN DEFAULT FALSE,
            delivery_fee FLOAT DEFAULT 0.00,
            tax_rate FLOAT DEFAULT 0.08375,
            stripe_account_id TEXT,
            stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
            admin_approved BOOLEAN DEFAULT FALSE,
            admin_approved_at TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT TRUE,
            avg_rating FLOAT DEFAULT 0.0,
            review_count INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            producer_id INTEGER REFERENCES producers(id) ON DELETE CASCADE,
            name TEXT NOT NULL, description TEXT,
            category TEXT NOT NULL, price FLOAT NOT NULL,
            unit TEXT NOT NULL, quantity_available INTEGER DEFAULT 0,
            image_url TEXT, tags TEXT[],
            is_active BOOLEAN DEFAULT TRUE,
            is_prohibited BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            shopper_id INTEGER REFERENCES users(id),
            producer_id INTEGER REFERENCES producers(id),
            status TEXT NOT NULL DEFAULT '"'"'pending'"'"',
            fulfillment_type TEXT NOT NULL DEFAULT '"'"'pickup'"'"',
            subtotal FLOAT NOT NULL DEFAULT 0.00,
            tax_amount FLOAT NOT NULL DEFAULT 0.00,
            delivery_fee FLOAT NOT NULL DEFAULT 0.00,
            total FLOAT NOT NULL DEFAULT 0.00,
            stripe_payment_intent_id TEXT,
            stripe_charge_id TEXT,
            respond_by_at TIMESTAMPTZ,
            confirmed_at TIMESTAMPTZ, ready_at TIMESTAMPTZ,
            fulfilled_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ,
            cancel_reason TEXT, pickup_notes TEXT,
            delivery_address TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id),
            product_name TEXT NOT NULL, product_unit TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price FLOAT NOT NULL, subtotal FLOAT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(id) UNIQUE,
            shopper_id INTEGER REFERENCES users(id),
            producer_id INTEGER REFERENCES producers(id),
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
            order_id INTEGER REFERENCES orders(id),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_flags (
            id SERIAL PRIMARY KEY,
            target_type TEXT NOT NULL, target_id INTEGER NOT NULL,
            reason TEXT NOT NULL,
            reported_by INTEGER REFERENCES users(id),
            status TEXT DEFAULT '"'"'pending'"'"',
            reviewed_by INTEGER REFERENCES users(id),
            reviewed_at TIMESTAMPTZ, notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS saved_producers (
            id SERIAL PRIMARY KEY,
            shopper_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            producer_id INTEGER REFERENCES producers(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(shopper_id, producer_id)
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_products_producer ON products(producer_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_orders_shopper ON orders(shopper_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_orders_producer ON orders(producer_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_producers_active ON producers(is_active, admin_approved);")
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database initialized — all tables created.")
