from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

# ── AUTH ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str

# ── USER ─────────────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # admin | sales | boss

class RoleUpdate(BaseModel):
    role: str

class UserUpdate(BaseModel):
    role: str
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ── WORKER ───────────────────────────────────────────
class WorkerCreate(BaseModel):
    firstname: str
    lastname: str
    age: Optional[int] = None
    position: Optional[str] = None

class WorkerOut(BaseModel):
    id: int
    firstname: str
    lastname: str
    age: Optional[int]
    position: Optional[str]
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

# ── PRODUCTION ───────────────────────────────────────
class ProductionCreate(BaseModel):
    worker_id: int
    daily_salary: Decimal
    date: date

class ProductionOut(BaseModel):
    id: int
    worker_id: int
    daily_salary: Decimal
    date: date
    logged_by: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True

# ── SALES ────────────────────────────────────────────
class SalesCreate(BaseModel):
    amount: float
    description: Optional[str] = None

class SalesOut(BaseModel):
    id: int
    amount: float
    description: Optional[str]
    logged_by: Optional[int]
    timestamp: datetime
    class Config:
        from_attributes = True

# ── FORM FIELD ───────────────────────────────────────
class FormFieldCreate(BaseModel):
    name: str
    label: str
    field_type: str
    options: Optional[str] = None
    is_required: bool = False
    module: str
    panel: str = "admin"  # admin | sales

class FormFieldOut(BaseModel):
    id: int
    name: str
    label: str
    field_type: str
    options: Optional[str]
    is_required: bool
    is_active: bool
    module: str
    panel: str = "admin"
    class Config:
        from_attributes = True

# ── IP LOG ───────────────────────────────────────────
class IpLogCreate(BaseModel):
    soni: int
    narxi: Decimal
    date: date
    logged_by: Optional[str] = None

class IpLogOut(BaseModel):
    id: int
    soni: int
    narxi: Decimal
    date: date
    logged_by: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# ── SKOCH LOG ─────────────────────────────────────────
class SkochLogCreate(BaseModel):
    razmer: str
    soni: int
    narxi: Decimal
    date: date
    logged_by: Optional[str] = None

class SkochLogOut(BaseModel):
    id: int
    razmer: str
    soni: int
    narxi: Decimal
    date: date
    logged_by: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# ── TOSH LOG ──────────────────────────────────────────
class ToshLogCreate(BaseModel):
    turi: str
    color: Optional[str] = None
    soni: int
    narxi: Decimal
    date: date
    logged_by: Optional[str] = None

class ToshLogOut(BaseModel):
    id: int
    turi: str
    color: Optional[str]
    soni: int
    narxi: Decimal
    date: date
    logged_by: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# ── ATTENDANCE ───────────────────────────────────────
class AttendanceCreate(BaseModel):
    worker_id: int
    date: date
    status: str
    note: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    worker_id: int
    date: date
    status: str
    note: Optional[str]
    logged_by: Optional[int]
    created_at: datetime
    class Config:
        from_attributes = True

# ── MATERIAL ─────────────────────────────────────────
class MaterialCreate(BaseModel):
    name: str
    color: Optional[str] = None
    quantity_rolls: int
    length_meters: Decimal
    date: date

class MaterialOut(BaseModel):
    id: int
    name: str
    color: Optional[str]
    quantity_rolls: int
    length_meters: Decimal
    date: date
    created_at: datetime
    class Config:
        from_attributes = True

# ── PURCHASE (unified xaridlar) ───────────────────────
class PurchaseCreate(BaseModel):
    date: date
    type: str               # ip | skoch | material | tosh
    detail: Optional[str] = None
    color: Optional[str] = None
    soni: int
    narxi: Decimal
    notes: Optional[str] = None
    logged_by: Optional[str] = None

class PurchaseOut(BaseModel):
    id: int
    date: date
    type: str
    detail: Optional[str]
    color: Optional[str]
    soni: int
    narxi: Decimal
    notes: Optional[str]
    logged_by: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True
