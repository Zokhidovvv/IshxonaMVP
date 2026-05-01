from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from ..database import get_db
from ..models.production import ProductionLog
from ..models.sales import SalesLog
from ..models.worker import Worker
from ..models.user import User
from ..models.material import Material
from ..models.ip_log import IpLog
from ..models.skoch_log import SkochLog
from ..models.tosh_log import ToshLog
from ..models.attendance import Attendance
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/admin-stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    today = date.today()
    total_workers = db.query(func.count(Worker.id)).filter(Worker.is_active == True).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_production = db.query(func.sum(ProductionLog.daily_salary)).scalar() or 0
    total_sales = db.query(func.sum(SalesLog.amount)).scalar() or 0
    today_production = db.query(func.sum(ProductionLog.daily_salary)).filter(
        ProductionLog.date == today).scalar() or 0
    today_sales = db.query(func.sum(SalesLog.amount)).filter(
        func.date(SalesLog.timestamp) == today).scalar() or 0
    return {
        "total_workers": int(total_workers),
        "total_users": int(total_users),
        "total_production": float(total_production),
        "total_sales": float(total_sales),
        "today_production": float(today_production),
        "today_sales": float(today_sales),
    }

# Quyidagi 3 endpoint public — login shart emas (TV ekran uchun)

@router.get("/top")
def top_workers(db: Session = Depends(get_db)):
    results = (
        db.query(
            (Worker.firstname + " " + Worker.lastname).label("name"),
            func.sum(ProductionLog.daily_salary).label("total")
        )
        .join(ProductionLog, Worker.id == ProductionLog.worker_id)
        .group_by(Worker.id, Worker.firstname, Worker.lastname)
        .order_by(func.sum(ProductionLog.daily_salary).desc())
        .limit(10)
        .all()
    )
    return [{"rank": i+1, "name": r.name, "total": float(r.total)} for i, r in enumerate(results)]

@router.get("/daily")
def daily_stats(db: Session = Depends(get_db)):
    today = date.today()
    prod = db.query(func.sum(ProductionLog.daily_salary)).filter(
        ProductionLog.date == today).scalar() or 0
    sales = db.query(func.sum(SalesLog.amount)).filter(
        func.date(SalesLog.timestamp) == today).scalar() or 0
    workers_today = db.query(func.count(func.distinct(ProductionLog.worker_id))).filter(
        ProductionLog.date == today).scalar() or 0
    return {
        "date": str(today),
        "today_production": float(prod),
        "total_sales": float(sales),
        "active_workers": int(workers_today)
    }

@router.get("/weekly")
def weekly_trend(db: Session = Depends(get_db)):
    result = []
    for i in range(6, -1, -1):
        day = date.today() - timedelta(days=i)
        prod = db.query(func.sum(ProductionLog.daily_salary)).filter(
            ProductionLog.date == day).scalar() or 0
        sales = db.query(func.sum(SalesLog.amount)).filter(
            func.date(SalesLog.timestamp) == day).scalar() or 0
        result.append({
            "date": str(day),
            "label": day.strftime("%a"),
            "production": float(prod),
            "sales": float(sales)
        })
    return result

@router.get("/purchases")
def today_purchases(db: Session = Depends(get_db)):
    today = date.today()
    ip_sum = db.query(func.sum(IpLog.narxi * IpLog.soni)).filter(IpLog.date == today).scalar() or 0
    skoch_sum = db.query(func.sum(SkochLog.narxi * SkochLog.soni)).filter(SkochLog.date == today).scalar() or 0
    tosh_sum = db.query(func.sum(ToshLog.narxi * ToshLog.soni)).filter(ToshLog.date == today).scalar() or 0
    mat_count = db.query(func.count(Material.id)).scalar() or 0
    ip_count = db.query(func.sum(IpLog.soni)).filter(IpLog.date == today).scalar() or 0
    skoch_count = db.query(func.sum(SkochLog.soni)).filter(SkochLog.date == today).scalar() or 0
    tosh_count = db.query(func.sum(ToshLog.soni)).filter(ToshLog.date == today).scalar() or 0
    return {
        "ip_sum": float(ip_sum),
        "ip_count": int(ip_count or 0),
        "skoch_sum": float(skoch_sum),
        "skoch_count": int(skoch_count or 0),
        "tosh_sum": float(tosh_sum),
        "tosh_count": int(tosh_count or 0),
        "materials_count": int(mat_count),
    }

@router.get("/attendance")
def today_attendance(db: Session = Depends(get_db)):
    today = date.today()
    keldi_count = db.query(func.count(Attendance.id)).filter(
        Attendance.date == today,
        Attendance.status == "keldi"
    ).scalar() or 0
    kelmadi = (
        db.query(
            Attendance.worker_id,
            (Worker.firstname + " " + Worker.lastname).label("name")
        )
        .join(Worker, Worker.id == Attendance.worker_id)
        .filter(Attendance.date == today, Attendance.status == "kelmadi")
        .all()
    )
    return {
        "keldi_count": int(keldi_count),
        "kelmadi_list": [{"worker_id": r.worker_id, "name": r.name} for r in kelmadi]
    }
