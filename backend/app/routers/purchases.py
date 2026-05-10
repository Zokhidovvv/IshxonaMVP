from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.purchase import Purchase
from ..schemas.schemas import PurchaseCreate, PurchaseOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/purchases", tags=["purchases"])

@router.get("/", response_model=List[PurchaseOut])
def get_purchases(
    type: Optional[str] = Query(None),
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss", "sales"))
):
    q = db.query(Purchase)
    if type:
        q = q.filter(Purchase.type == type)
    if start:
        q = q.filter(Purchase.date >= start)
    if end:
        q = q.filter(Purchase.date <= end)
    return q.order_by(Purchase.date.desc(), Purchase.created_at.desc()).all()

@router.post("/", response_model=PurchaseOut)
def create_purchase(
    data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "sales", "boss"))
):
    d = data.model_dump()
    d.pop("logged_by", None)
    purchase = Purchase(**d, logged_by=current_user.username)
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase

@router.put("/{pid}", response_model=PurchaseOut)
def update_purchase(
    pid: int,
    data: PurchaseCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "sales", "boss"))
):
    p = db.query(Purchase).filter(Purchase.id == pid).first()
    if not p:
        raise HTTPException(404, "Topilmadi")
    d = data.model_dump()
    d.pop("logged_by", None)
    for k, v in d.items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/{pid}")
def delete_purchase(
    pid: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "sales", "boss"))
):
    p = db.query(Purchase).filter(Purchase.id == pid).first()
    if not p:
        raise HTTPException(404, "Topilmadi")
    db.delete(p)
    db.commit()
    return {"message": "O'chirildi"}

@router.get("/stats/today")
def today_stats(db: Session = Depends(get_db)):
    from datetime import date as dt
    today = dt.today()
    rows = db.query(Purchase).filter(Purchase.date == today).all()
    total = sum(float(r.narxi) * r.soni for r in rows)
    by_type = {}
    for r in rows:
        t = r.type
        if t not in by_type:
            by_type[t] = {"count": 0, "sum": 0}
        by_type[t]["count"] += 1
        by_type[t]["sum"] += float(r.narxi) * r.soni
    return {"total": total, "count": len(rows), "by_type": by_type}
