from sqlalchemy import Column, Integer, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class ProductionLog(Base):
    __tablename__ = "production_logs"
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    daily_salary = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False)
    logged_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
