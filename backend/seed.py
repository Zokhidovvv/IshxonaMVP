# coding: utf-8
"""
Demo ma'lumotlar yuklash:
    python seed.py
"""
import sys
import pg8000.native
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

conn = pg8000.native.Connection(
    host="localhost",
    port=5432,
    database="factory_db",
    user="postgres",
    password="13522531Asdf",
)

def hash_password(pw):
    return pwd_ctx.hash(pw)

# ── Foydalanuvchilar ──────────────────────────────────
users = [
    ("admin", "admin123", "admin"),
    ("boss",  "boss123",  "boss"),
    ("sales", "sales123", "sales"),
]

for username, password, role in users:
    existing = conn.run("SELECT id FROM users WHERE username = :u", u=username)
    if not existing:
        conn.run(
            "INSERT INTO users (username, password_hash, role) VALUES (:u, :p, :r)",
            u=username, p=hash_password(password), r=role
        )

# ── Namuna ishchilar ──────────────────────────────────
workers = [
    ("Aliyev",    "Jasur",    28, "Tikuvchi"),
    ("Karimov",   "Bobur",    32, "Tikuvchi"),
    ("Toshmatov", "Sardor",   25, "Tikuvchi"),
    ("Yusupova",  "Malika",   30, "Tikuvchi"),
    ("Ergasheva", "Zulfiya",  27, "Tikuvchi"),
    ("Nazarov",   "Ulugbek",  35, "Tikuvchi"),
]

for lastname, firstname, age, position in workers:
    existing = conn.run(
        "SELECT id FROM workers WHERE firstname=:f AND lastname=:l",
        f=firstname, l=lastname
    )
    if not existing:
        conn.run(
            "INSERT INTO workers (firstname, lastname, age, position) VALUES (:f, :l, :a, :p)",
            f=firstname, l=lastname, a=age, p=position
        )

conn.close()
print("[DONE] Seed muvaffaqiyatli!")
print("  admin  / admin123")
print("  boss   / boss123")
print("  sales  / sales123")
print("  + 6 ta namuna ishchi")
