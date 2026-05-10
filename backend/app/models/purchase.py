from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    type = Column(String(20), nullable=False)   # ip | skoch | material | tosh
    detail = Column(String(200), nullable=True) # rang / razmer / nomi / turi
    color = Column(String(50), nullable=True)   # material va tosh uchun rang
    soni = Column(Integer, nullable=False)
    narxi = Column(Numeric(12, 2), nullable=False)
    notes = Column(Text, nullable=True)
    logged_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
