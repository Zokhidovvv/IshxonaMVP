from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.schemas import LoginRequest, TokenResponse
from ..core.security import verify_password, create_token
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Login yoki parol xato")
    token = create_token({"user_id": user.id, "role": user.role})
    return {"access_token": token, "role": user.role, "username": user.username}

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "role": current_user.role}
