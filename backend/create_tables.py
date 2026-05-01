"""
Barcha jadvallarni to'g'ridan-to'g'ri PostgreSQL da yaratadi.
Ishga tushirish: python create_tables.py
"""
import pg8000.native

conn = pg8000.native.Connection(
    host="localhost",
    port=5432,
    database="factory_db",
    user="postgres",
    password="13522531Asdf",
)

tables = [
    ("users", """
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            username      VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role          VARCHAR(20)  NOT NULL DEFAULT 'sales',
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """),
    ("workers", """
        CREATE TABLE IF NOT EXISTS workers (
            id         SERIAL PRIMARY KEY,
            firstname  VARCHAR(100) NOT NULL,
            lastname   VARCHAR(100) NOT NULL,
            age        INTEGER,
            position   VARCHAR(100),
            is_active  BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """),
    ("production_logs", """
        CREATE TABLE IF NOT EXISTS production_logs (
            id           SERIAL PRIMARY KEY,
            worker_id    INTEGER NOT NULL REFERENCES workers(id),
            daily_salary NUMERIC(12,2) NOT NULL,
            date         DATE NOT NULL,
            logged_by    INTEGER REFERENCES users(id),
            created_at   TIMESTAMP DEFAULT NOW()
        )
    """),
    ("materials", """
        CREATE TABLE IF NOT EXISTS materials (
            id             SERIAL PRIMARY KEY,
            name           VARCHAR(200) NOT NULL,
            quantity_rolls INTEGER NOT NULL,
            length_meters  NUMERIC(10,2) NOT NULL,
            date           DATE NOT NULL,
            created_at     TIMESTAMP DEFAULT NOW()
        )
    """),
    ("sales_logs", """
        CREATE TABLE IF NOT EXISTS sales_logs (
            id          SERIAL PRIMARY KEY,
            amount      NUMERIC(14,2) NOT NULL,
            description TEXT,
            logged_by   INTEGER REFERENCES users(id),
            timestamp   TIMESTAMP DEFAULT NOW()
        )
    """),
    ("form_fields", """
        CREATE TABLE IF NOT EXISTS form_fields (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(100) NOT NULL,
            label       VARCHAR(200) NOT NULL,
            field_type  VARCHAR(20)  NOT NULL DEFAULT 'text',
            options     TEXT,
            is_required BOOLEAN DEFAULT FALSE,
            is_active   BOOLEAN DEFAULT TRUE,
            module      VARCHAR(50)  NOT NULL
        )
    """),
]

for name, sql in tables:
    conn.run(sql)
    print(f"  [OK] {name}")

conn.close()
print("\n[DONE] Barcha jadvallar tayyor!")
