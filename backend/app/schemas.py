# app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ReceiptBase(BaseModel):
    vendor: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "IDR"
    expense_date: Optional[datetime] = None
    category: Optional[str] = None
    data: Optional[dict] = None


class ReceiptCreate(ReceiptBase):
    pass


class ReceiptUpdate(ReceiptBase):
    pass


class ReceiptRead(ReceiptBase):
    id: str
    created_at: datetime
    deleted: bool = False

    class Config:
        from_attributes = True
