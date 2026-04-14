import psycopg2
import bcrypt

DB = "postgresql://neondb_owner:npg_NR0vHjlZoe5J@ep-soft-frog-an54ody9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

password = "ChronosAI2026!"
hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

conn = psycopg2.connect(DB)
cur = conn.cursor()

cur.execute("""
    INSERT INTO users (email, password_hash, role, full_name)
    VALUES (%s, %s, 'admin', 'Samantha Banuelos')
    ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash
    RETURNING id, role
""", ("samantha@hypercruit.net", hashed))

row = cur.fetchone()
conn.commit()
cur.close()
conn.close()
print("Admin created — ID:", row[0], "Role:", row[1])
