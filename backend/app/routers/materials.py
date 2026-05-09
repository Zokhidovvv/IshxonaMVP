from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.material import Material
from ..schemas.schemas import MaterialCreate, MaterialOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/materials", tags=["materials"])

@router.get("/", response_model=List[MaterialOut])
def get_materials(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "boss", "sales"))
):
    q = db.query(Material)
    if start:
        q = q.filter(Material.date >= start)
    if end:
        q = q.filter(Material.date <= end)
    return q.order_by(Material.date.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=MaterialOut)
def create_material(data: MaterialCreate, db: Session = Depends(get_db), _=Depends(require_role("admin", "sales"))):
    material = Material(**data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)
    return material

@router.put("/{material_id}", response_model=MaterialOut)
def update_material(material_id: int, data: MaterialCreate, db: Session = Depends(get_db), _=Depends(require_role("admin", "sales", "boss"))):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Material topilmadi")
    for k, v in data.model_dump().items():
        setattr(material, k, v)
    db.commit(); db.refresh(material)
    return material

@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin", "sales", "boss"))):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(404, "Material topilmadi")
    db.delete(material); db.commit()
    return {"message": "Material o'chirildi"}
