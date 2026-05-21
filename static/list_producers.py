import psycopg2

DB = "postgresql://neondb_owner:npg_NR0vHjlZoe5J@ep-soft-frog-an54ody9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

conn = psycopg2.connect(DB)
cur = conn.cursor()

# List all producers
cur.execute("""
    SELECT p.id, p.shop_name, p.city, p.admin_approved, p.is_active, u.email
    FROM producers p JOIN users u ON p.user_id = u.id
    ORDER BY p.id
""")
rows = cur.fetchall()
print("All producers:")
for r in rows:
    print(f"  ID:{r[0]} | {r[1]} | {r[2]} | approved:{r[3]} | active:{r[4]} | {r[5]}")

cur.close()
conn.close()
