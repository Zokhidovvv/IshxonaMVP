from sqlalchemy import Column, Integer, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class SalesLog(Base):
    __tablename__ = "sales_logs"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text)
    logged_by = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=func.now())
