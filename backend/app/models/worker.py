from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Worker(Base):
    __tablename__ = "workers"
    id = Column(Integer, primary_key=True, index=True)
    firstname = Column(String(100), nullable=False)
    lastname = Column(String(100), nullable=False)
    age = Column(Integer)
    position = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
