import psycopg2
import bcrypt

DB = "postgresql://neondb_owner:npg_NR0vHjlZoe5J@ep-soft-frog-an54ody9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

conn = psycopg2.connect(DB)
cur = conn.cursor()

accounts = [
    ("shopper@fromourplace.demo", "Demo2026!", "shopper", "Demo Shopper"),
    ("producer@fromourplace.demo", "Demo2026!", "producer", "Demo Producer"),
]

for email, password, role, name in accounts:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cur.execute("""
        INSERT INTO users (email, password_hash, role, full_name)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id, role
    """, (email, hashed, role, name))
    row = cur.fetchone()
    print(f"Created: {email} | ID:{row[0]} | {role}")

conn.commit()
cur.close()
conn.close()
print("Done!")
