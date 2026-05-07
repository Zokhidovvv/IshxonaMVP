from sqlalchemy import Column, Integer, String, Boolean, Text
from ..database import Base

class FormField(Base):
    __tablename__ = "form_fields"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    label = Column(String(200), nullable=False)
    field_type = Column(String(50), nullable=False)  # text | number | select
    options = Column(Text)   # JSON string, faqat select uchun
    is_required = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    module = Column(String(50), nullable=False)  # production | sales
    panel = Column(String(50), nullable=False, default="admin")  # admin | sales
