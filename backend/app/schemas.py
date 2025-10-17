# app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal

# If you're on Pydantic v2, uncomment the next line and the model_config below:
from pydantic import ConfigDict


class ExpenseBase(BaseModel):
    vendor: Optional[str] = None
    amount: Decimal
    currency: str  # keep explicit; default is handled in DB/model if omitted
    expense_date: Optional[datetime] = None  # align with SQLAlchemy DateTime
    category: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    # If you want to allow omitting currency and fall back to model default ("IDR"),
    # make it Optional[str] = None. For now, keep it required to be explicit.
    pass


class ExpenseRead(ExpenseBase):
    id: str  # shortuuid is a string, not a UUID
    created_at: Optional[datetime] = None
    receipt_id: Optional[str] = None  # expose FK if you want it in GET

    # ---- Pick ONE of these depending on your Pydantic version ----
    model_config = ConfigDict(from_attributes=True)
