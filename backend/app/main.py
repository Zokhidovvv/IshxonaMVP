from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine, Base
from .routers import auth, workers, production, sales, dashboard, users, materials, ip, skoch, tosh, attendance, purchases
from .models import ip_log, skoch_log, tosh_log, attendance as attendance_model, purchase

Base.metadata.create_all(bind=engine)

# ── Mavjud jadvalga yangi ustun qo'shish (idempotent migrations) ──────────────
_migrations = [
    "ALTER TABLE purchases  ADD COLUMN IF NOT EXISTS color VARCHAR(50)",
    "ALTER TABLE materials  ADD COLUMN IF NOT EXISTS color VARCHAR(50)",
    "ALTER TABLE tosh_logs  ADD COLUMN IF NOT EXISTS color VARCHAR(50)",
]
with engine.connect() as _conn:
    for _sql in _migrations:
        try:
            _conn.execute(text(_sql))
        except Exception:
            pass
    _conn.commit()

app = FastAPI(title="Factory API", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(workers.router)
app.include_router(production.router)
app.include_router(sales.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(materials.router)
app.include_router(ip.router)
app.include_router(skoch.router)
app.include_router(tosh.router)
app.include_router(attendance.router)
app.include_router(purchases.router)

@app.get("/")
def root():
    return {"status": "ok", "message": "Factory API ishlamoqda 🚀"}
