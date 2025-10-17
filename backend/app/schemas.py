# app/schemas.py
from typing import List, Optional
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


class ReceiptRead(BaseModel):
    id: str
    vendor: Optional[str]
    amount: Optional[float]
    currency: str
    category: Optional[str]
    expense_date: Optional[datetime]
    data: dict
    created_at: datetime
    deleted: bool

    class Config:
        from_attributes = True  # pydantic v2 replacement for orm_mode


class PaginatedReceipts(BaseModel):
    total: int
    limit: int
    offset: int
    results: List[ReceiptRead]
