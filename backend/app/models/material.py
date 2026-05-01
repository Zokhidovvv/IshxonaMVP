from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    quantity_rolls = Column(Integer, nullable=False)
    length_meters = Column(Numeric(10, 2), nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=func.now())
