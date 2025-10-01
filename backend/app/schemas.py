from pydantic import BaseModel
from datetime import date
from typing import Optional
import uuid


class ExpenseBase(BaseModel):
    vendor: Optional[str]
    amount: float
    currency: str = "USD"
    expense_date: Optional[date]
    category: Optional[str]


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseRead(ExpenseBase):
    id: uuid.UUID

    class Config:
        orm_mode = True
