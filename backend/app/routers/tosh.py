from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from ..database import get_db
from ..models.tosh_log import ToshLog
from ..schemas.schemas import ToshLogCreate, ToshLogOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/tosh", tags=["tosh"])

@router.get("/", response_model=List[ToshLogOut])
def get_tosh_logs(
    start: date = Query(None),
    end: date = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss", "sales"))
):
    q = db.query(ToshLog)
    if start:
        q = q.filter(ToshLog.date >= start)
    if end:
        q = q.filter(ToshLog.date <= end)
    return q.order_by(ToshLog.date.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=ToshLogOut)
def create_tosh_log(
    data: ToshLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "sales"))
):
    log = ToshLog(**data.model_dump(), logged_by=current_user.username)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.delete("/{log_id}")
def delete_tosh_log(
    log_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin"))
):
    log = db.query(ToshLog).filter(ToshLog.id == log_id).first()
    if not log:
        raise HTTPException(404, "Yozuv topilmadi")
    db.delete(log)
    db.commit()
    return {"message": "O'chirildi"}
