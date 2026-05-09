from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from ..database import get_db
from ..models.ip_log import IpLog
from ..schemas.schemas import IpLogCreate, IpLogOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/ip", tags=["ip"])

@router.get("/", response_model=List[IpLogOut])
def get_ip_logs(
    start: date = Query(None),
    end: date = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss", "sales"))
):
    q = db.query(IpLog)
    if start:
        q = q.filter(IpLog.date >= start)
    if end:
        q = q.filter(IpLog.date <= end)
    return q.order_by(IpLog.date.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=IpLogOut)
def create_ip_log(
    data: IpLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "sales", "boss"))
):
    d = data.model_dump(); d.pop('logged_by', None)
    log = IpLog(**d, logged_by=current_user.username)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.put("/{log_id}", response_model=IpLogOut)
def update_ip_log(log_id: int, data: IpLogCreate, db: Session = Depends(get_db), _=Depends(require_role("admin", "sales", "boss"))):
    log = db.query(IpLog).filter(IpLog.id == log_id).first()
    if not log:
        raise HTTPException(404, "Yozuv topilmadi")
    d = data.model_dump(); d.pop('logged_by', None)
    for k, v in d.items():
        setattr(log, k, v)
    db.commit(); db.refresh(log)
    return log

@router.delete("/{log_id}")
def delete_ip_log(log_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin", "sales", "boss"))):
    log = db.query(IpLog).filter(IpLog.id == log_id).first()
    if not log:
        raise HTTPException(404, "Yozuv topilmadi")
    db.delete(log); db.commit()
    return {"message": "O'chirildi"}
