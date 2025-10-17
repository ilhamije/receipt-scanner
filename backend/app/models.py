import shortuuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db import Base


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(String, primary_key=True, default=lambda: shortuuid.uuid())
    data = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    expense = relationship("Expense", back_populates="receipt", uselist=False)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=lambda: shortuuid.uuid())
    vendor = Column(String)
    amount = Column(Numeric(12, 2))
    currency = Column(String, default="IDR")
    expense_date = Column(DateTime)
    category = Column(String, nullable=True)

    receipt_id = Column(String, ForeignKey("receipts.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    receipt = relationship("Receipt", back_populates="expense")
