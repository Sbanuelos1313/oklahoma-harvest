import psycopg2
import bcrypt

DB = "postgresql://neondb_owner:npg_NR0vHjlZoe5J@ep-soft-frog-an54ody9-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

conn = psycopg2.connect(DB)
cur = conn.cursor()
cur.execute("SELECT password_hash FROM users WHERE email = 'samantha@hypercruit.net'")
stored_hash = cur.fetchone()[0]
cur.close(); conn.close()

print("Stored hash type:", type(stored_hash))
print("Hash prefix:", stored_hash[:7])

password = "ChronosAI2026!"
result = bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
print("Match:", result)

# Also test what Render's auth.py does exactly
plain = password
hashed = stored_hash
test = bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
print("Exact auth.py logic match:", test)
