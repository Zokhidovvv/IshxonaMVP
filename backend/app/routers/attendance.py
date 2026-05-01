from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.attendance import Attendance
from ..models.worker import Worker
from ..schemas.schemas import AttendanceCreate, AttendanceOut
from ..core.dependencies import require_role, get_current_user

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

@router.get("/", response_model=List[AttendanceOut])
def get_attendance(
    date_filter: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss"))
):
    q = db.query(Attendance)
    if date_filter:
        q = q.filter(Attendance.date == date_filter)
    return q.order_by(Attendance.date.desc()).all()

@router.post("/bulk")
def save_bulk_attendance(
    items: List[AttendanceCreate],
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    for item in items:
        existing = db.query(Attendance).filter(
            Attendance.worker_id == item.worker_id,
            Attendance.date == item.date
        ).first()
        if existing:
            existing.status = item.status
            existing.note = item.note
            existing.logged_by = current_user.id
        else:
            rec = Attendance(
                worker_id=item.worker_id,
                date=item.date,
                status=item.status,
                note=item.note,
                logged_by=current_user.id
            )
            db.add(rec)
    db.commit()
    return {"message": "Davomat saqlandi", "count": len(items)}

@router.post("/", response_model=AttendanceOut)
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    existing = db.query(Attendance).filter(
        Attendance.worker_id == data.worker_id,
        Attendance.date == data.date
    ).first()
    if existing:
        existing.status = data.status
        existing.note = data.note
        existing.logged_by = current_user.id
        db.commit()
        db.refresh(existing)
        return existing
    rec = Attendance(**data.model_dump(), logged_by=current_user.id)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

@router.put("/{att_id}", response_model=AttendanceOut)
def update_attendance(
    att_id: int,
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    rec = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not rec:
        from fastapi import HTTPException
        raise HTTPException(404, "Davomat topilmadi")
    rec.status = data.status
    rec.note = data.note
    rec.logged_by = current_user.id
    db.commit()
    db.refresh(rec)
    return rec

@router.get("/stats")
def attendance_stats(
    month: str = Query(..., description="Format: 2024-04"),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss"))
):
    year, mon = int(month.split("-")[0]), int(month.split("-")[1])
    from datetime import date as dt
    import calendar
    last_day = calendar.monthrange(year, mon)[1]
    start = dt(year, mon, 1)
    end = dt(year, mon, last_day)

    workers = db.query(Worker).filter(Worker.is_active == True).all()
    results = []
    for w in workers:
        recs = db.query(Attendance).filter(
            Attendance.worker_id == w.id,
            Attendance.date >= start,
            Attendance.date <= end
        ).all()
        counts = {"keldi": 0, "kelmadi": 0, "yarim_kun": 0, "kasal": 0, "tatil": 0}
        for r in recs:
            if r.status in counts:
                counts[r.status] += 1
        results.append({
            "worker_id": w.id,
            "name": f"{w.firstname} {w.lastname}",
            **counts,
            "jami": len(recs)
        })
    return results
