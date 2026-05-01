from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..schemas.schemas import UserCreate, UserOut, RoleUpdate
from ..core.security import hash_password
from ..core.dependencies import require_role, get_current_user

VALID_ROLES = ("admin", "sales", "boss")

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/", response_model=List[UserOut])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin"))
):
    return db.query(User).offset(skip).limit(limit).all()

@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if data.role not in VALID_ROLES:
        raise HTTPException(400, "Rol noto'g'ri. admin | sales | boss bo'lishi kerak")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Bu username band")
    user = User(username=data.username, password_hash=hash_password(data.password), role=data.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}/role", response_model=UserOut)
def change_role(user_id: int, body: RoleUpdate, db: Session = Depends(get_db), current=Depends(get_current_user), _=Depends(require_role("admin"))):
    if body.role not in VALID_ROLES:
        raise HTTPException(400, "Rol noto'g'ri. admin | sales | boss bo'lishi kerak")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Foydalanuvchi topilmadi")
    if user.id == current.id:
        raise HTTPException(400, "O'z rolingizni o'zgartira olmaysiz")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current=Depends(get_current_user), _=Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Foydalanuvchi topilmadi")
    if user.id == current.id:
        raise HTTPException(400, "O'zingizni o'chira olmaysiz")
    db.delete(user)
    db.commit()
    return {"message": "O'chirildi"}
