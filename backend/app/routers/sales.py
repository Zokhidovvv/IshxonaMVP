from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from ..database import get_db
from ..models.sales import SalesLog
from ..schemas.schemas import SalesCreate, SalesOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/sales", tags=["sales"])

@router.get("/", response_model=List[SalesOut])
def get_sales(
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "sales", "boss"))
):
    q = db.query(SalesLog)
    if start:
        q = q.filter(SalesLog.timestamp >= datetime.combine(start, datetime.min.time()))
    if end:
        q = q.filter(SalesLog.timestamp <= datetime.combine(end, datetime.max.time()))
    return q.order_by(SalesLog.timestamp.desc()).all()

@router.post("/", response_model=SalesOut)
def add_sale(data: SalesCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "sales"))):
    log = SalesLog(**data.dict(), logged_by=user.id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/today")
def today_sales(db: Session = Depends(get_db), _=Depends(require_role("admin", "sales", "boss"))):
    today = date.today()
    logs = db.query(SalesLog).filter(SalesLog.timestamp >= today).all()
    total = float(sum(l.amount for l in logs))
    return {"date": str(today), "total_amount": total, "entries": len(logs)}
