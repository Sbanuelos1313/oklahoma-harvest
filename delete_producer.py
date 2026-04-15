import psycopg2

DB = "postgresql://neondb_owner:npg_NR0vHjlZoe5J@ep-soft-frog-an54ody9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

conn = psycopg2.connect(DB)
cur = conn.cursor()

cur.execute("DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE producer_id = 2)")
print("Order items deleted:", cur.rowcount)

cur.execute("DELETE FROM notifications WHERE order_id IN (SELECT id FROM orders WHERE producer_id = 2)")
print("Notifications deleted:", cur.rowcount)

cur.execute("DELETE FROM orders WHERE producer_id = 2")
print("Orders deleted:", cur.rowcount)

cur.execute("DELETE FROM products WHERE producer_id = 2")
print("Products deleted:", cur.rowcount)

cur.execute("DELETE FROM producers WHERE id = 2")
print("Producer deleted:", cur.rowcount)

conn.commit()
cur.close()
conn.close()
print("Done!")
