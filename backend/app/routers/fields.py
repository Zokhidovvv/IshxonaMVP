from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.form_field import FormField
from ..schemas.schemas import FormFieldCreate, FormFieldOut
from ..core.dependencies import require_role

router = APIRouter(prefix="/api/fields", tags=["fields"])

@router.get("/", response_model=List[FormFieldOut])
def get_fields(module: Optional[str] = None, db: Session = Depends(get_db), _=Depends(require_role("admin", "sales", "boss"))):
    q = db.query(FormField).filter(FormField.is_active == True)
    if module:
        q = q.filter(FormField.module == module)
    return q.all()

@router.post("/", response_model=FormFieldOut)
def create_field(data: FormFieldCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    field = FormField(**data.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

@router.put("/{field_id}", response_model=FormFieldOut)
def update_field(field_id: int, data: FormFieldCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    field = db.query(FormField).filter(FormField.id == field_id).first()
    if not field:
        raise HTTPException(404, "Maydon topilmadi")
    for k, v in data.model_dump().items():
        setattr(field, k, v)
    db.commit()
    db.refresh(field)
    return field

@router.delete("/{field_id}")
def delete_field(field_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    field = db.query(FormField).filter(FormField.id == field_id).first()
    if not field:
        raise HTTPException(404, "Maydon topilmadi")
    field.is_active = False
    db.commit()
    return {"message": "O'chirildi"}
