from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine, Base
from .routers import auth, workers, production, sales, dashboard, users, fields, materials, ip, skoch, tosh, attendance
from .models import ip_log, skoch_log, tosh_log, attendance as attendance_model

Base.metadata.create_all(bind=engine)

# Migrate: add panel column to form_fields if missing
with engine.connect() as _conn:
    try:
        _conn.execute(text("ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS panel VARCHAR(50) DEFAULT 'admin'"))
        _conn.execute(text("UPDATE form_fields SET panel = 'admin' WHERE panel IS NULL"))
        _conn.commit()
    except Exception:
        _conn.rollback()

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
app.include_router(fields.router)
app.include_router(materials.router)
app.include_router(ip.router)
app.include_router(skoch.router)
app.include_router(tosh.router)
app.include_router(attendance.router)

@app.get("/")
def root():
    return {"status": "ok", "message": "Factory API ishlamoqda 🚀"}
