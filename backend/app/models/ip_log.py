from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime
from sqlalchemy.sql import func
from ..database import Base

class IpLog(Base):
    __tablename__ = "ip_logs"
    id = Column(Integer, primary_key=True, index=True)
    soni = Column(Integer, nullable=False)
    narxi = Column(Numeric(12, 2), nullable=False)
    date = Column(Date, nullable=False)
    logged_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
