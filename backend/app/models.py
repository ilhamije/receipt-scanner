from sqlalchemy import Column, String, DateTime, Boolean, Numeric, JSON
from sqlalchemy.sql import func
from app.db import Base
import shortuuid


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(String, primary_key=True, default=lambda: shortuuid.uuid())
    vendor = Column(String, nullable=True)
    amount = Column(Numeric, nullable=True)
    currency = Column(String, default="IDR")
    expense_date = Column(DateTime, nullable=True)
    category = Column(String, nullable=True)
    data = Column(JSON, nullable=True)
    deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
