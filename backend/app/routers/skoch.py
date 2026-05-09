from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from ..database import get_db
from ..models.skoch_log import SkochLog
from ..schemas.schemas import SkochLogCreate, SkochLogOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/skoch", tags=["skoch"])

@router.get("/", response_model=List[SkochLogOut])
def get_skoch_logs(
    start: date = Query(None),
    end: date = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss", "sales"))
):
    q = db.query(SkochLog)
    if start:
        q = q.filter(SkochLog.date >= start)
    if end:
        q = q.filter(SkochLog.date <= end)
    return q.order_by(SkochLog.date.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=SkochLogOut)
def create_skoch_log(
    data: SkochLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "sales"))
):
    d = data.model_dump(); d.pop('logged_by', None)
    log = SkochLog(**d, logged_by=current_user.username)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.delete("/{log_id}")
def delete_skoch_log(
    log_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin"))
):
    log = db.query(SkochLog).filter(SkochLog.id == log_id).first()
    if not log:
        raise HTTPException(404, "Yozuv topilmadi")
    db.delete(log)
    db.commit()
    return {"message": "O'chirildi"}
