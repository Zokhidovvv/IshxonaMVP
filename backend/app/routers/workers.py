from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.worker import Worker
from ..schemas.schemas import WorkerCreate, WorkerOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/workers", tags=["workers"])

@router.get("/", response_model=List[WorkerOut])
def get_workers(
    search: Optional[str] = Query(None, description="Ism bo'yicha qidirish"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss"))
):
    q = db.query(Worker).filter(Worker.is_active == True)
    if search:
        q = q.filter(Worker.name.ilike(f"%{search}%"))
    return q.offset(skip).limit(limit).all()

@router.get("/{worker_id}", response_model=WorkerOut)
def get_worker(worker_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin", "boss"))):
    worker = db.query(Worker).filter(Worker.id == worker_id, Worker.is_active == True).first()
    if not worker:
        raise HTTPException(404, "Ishchi topilmadi")
    return worker

@router.post("/", response_model=WorkerOut)
def create_worker(data: WorkerCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    worker = Worker(**data.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker

@router.put("/{worker_id}", response_model=WorkerOut)
def update_worker(worker_id: int, data: WorkerCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    worker = db.query(Worker).filter(Worker.id == worker_id, Worker.is_active == True).first()
    if not worker:
        raise HTTPException(404, "Ishchi topilmadi")
    worker.firstname = data.firstname
    worker.lastname = data.lastname
    worker.age = data.age
    worker.position = data.position
    db.commit()
    db.refresh(worker)
    return worker

@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(404, "Ishchi topilmadi")
    worker.is_active = False
    db.commit()
    return {"message": "Ishchi o'chirildi"}
