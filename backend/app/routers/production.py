from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.production import ProductionLog
from ..models.worker import Worker
from ..schemas.schemas import ProductionCreate, ProductionOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/production", tags=["production"])

@router.get("/", response_model=List[ProductionOut])
def get_logs(
    start: Optional[date] = None,
    end: Optional[date] = None,
    worker_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss"))
):
    q = db.query(ProductionLog)
    if start:
        q = q.filter(ProductionLog.date >= start)
    if end:
        q = q.filter(ProductionLog.date <= end)
    if worker_id:
        q = q.filter(ProductionLog.worker_id == worker_id)
    return q.order_by(ProductionLog.date.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=ProductionOut)
def add_log(data: ProductionCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    log = ProductionLog(**data.model_dump(), logged_by=user.id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/today")
def today_stats(db: Session = Depends(get_db), _=Depends(require_role("admin", "boss"))):
    today = date.today()
    logs = db.query(ProductionLog).filter(ProductionLog.date == today).all()
    total_salary = sum(float(l.daily_salary) for l in logs)
    return {"date": str(today), "total_salary": total_salary, "entries": len(logs)}
