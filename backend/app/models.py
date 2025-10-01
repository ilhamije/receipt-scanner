from sqlalchemy import Column, String, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True,
                default=uuid.uuid4, index=True)
    vendor = Column(String, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="USD")
    expense_date = Column(Date, nullable=True)
    category = Column(String, nullable=True)
