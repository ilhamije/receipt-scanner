from sqlalchemy import extract, or_, cast, String
from sqlalchemy.sql import and_, or_
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import text
from fastapi import Query, Depends, APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import extract, or_
from typing import Optional
from datetime import datetime
import shortuuid
import asyncio

from app.db import get_db
from app import models, schemas
from app.openai_handler import extract_receipt_text, parse_receipt_to_json

router = APIRouter(prefix="/receipts", tags=["Receipts"])


# ─────────────────────────────
# 🧠 Background OCR Processor
# ─────────────────────────────
def process_receipt_ocr(db: Session, file_bytes: bytes, filename: str, mime: str, receipt_id: str):
    """
    Background task: performs OCR + JSON parsing asynchronously,
    then updates the existing DB record.
    """
    async def run_ocr():
        try:
            ocr_text = await extract_receipt_text(file_bytes, filename, mime)
            parsed = await parse_receipt_to_json(ocr_text)

            receipt = db.query(models.Receipt).filter_by(id=receipt_id).first()
            if not receipt:
                return

            vendor = parsed.get("vendor")
            total = parsed.get("total")
            currency = parsed.get("currency", "IDR")
            date_str = parsed.get("date")

            expense_date = None
            if date_str:
                try:
                    expense_date = datetime.fromisoformat(date_str)
                except Exception:
                    expense_date = None

            # Update record
            receipt.vendor = vendor
            receipt.amount = total
            receipt.currency = currency
            receipt.expense_date = expense_date
            receipt.category = None
            receipt.data = parsed
            db.commit()

        except Exception as e:
            receipt = db.query(models.Receipt).filter_by(id=receipt_id).first()
            if receipt:
                receipt.data = {"error": str(e)}
                db.commit()

    asyncio.run(run_ocr())


# ─────────────────────────────
# 1️⃣ CREATE (Upload + Schedule OCR)
# ─────────────────────────────
@router.post("/", response_model=schemas.ReceiptRead)
async def upload_receipt(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Step 1: Save placeholder receipt.
    Step 2: Trigger background OCR task (non-blocking).
    """
    try:
        new_receipt = models.Receipt(
            id=shortuuid.uuid(),
            data={"status": "processing", "source_image": file.filename},
        )
        db.add(new_receipt)
        db.commit()
        db.refresh(new_receipt)

        # Schedule OCR
        file_bytes = await file.read()
        background_tasks.add_task(
            process_receipt_ocr, db, file_bytes, file.filename, file.content_type, new_receipt.id
        )

        return new_receipt

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Receipt upload failed: {e}")


# ─────────────────────────────
# 2️⃣ LIST (Hide failed OCR)
# ─────────────────────────────
@router.get("/", response_model=schemas.PaginatedReceipts)
def list_receipts(
    db: Session = Depends(get_db),
    vendor: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    include_deleted: bool = Query(False),
    hide_failed: bool = Query(True),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = db.query(models.Receipt)

    if not include_deleted:
        query = query.filter(models.Receipt.deleted.is_(False))

    # ✅ Fixed JSONB filter for SQLAlchemy 2.x
    if hide_failed:
        query = query.filter(
            or_(
                cast(models.Receipt.data["error"], String).is_(None),
                cast(models.Receipt.data["error"], String) == "",
            ),
            models.Receipt.vendor.isnot(None),
        )

    # Additional filters
    if vendor:
        query = query.filter(models.Receipt.vendor.ilike(f"%{vendor}%"))
    if category:
        query = query.filter(models.Receipt.category == category)
    if year:
        query = query.filter(
            extract("year", models.Receipt.expense_date) == year)
    if month:
        query = query.filter(
            extract("month", models.Receipt.expense_date) == month)
    if min_amount:
        query = query.filter(models.Receipt.amount >= min_amount)
    if max_amount:
        query = query.filter(models.Receipt.amount <= max_amount)

    total = query.count()
    results = (
        query.order_by(models.Receipt.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {"total": total, "limit": limit, "offset": offset, "results": results}


# ─────────────────────────────
# 3️⃣ GET SINGLE
# ─────────────────────────────
@router.get("/{receipt_id}", response_model=schemas.ReceiptRead)
def get_receipt(receipt_id: str, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).filter_by(
        id=receipt_id, deleted=False).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


# ─────────────────────────────
# 4️⃣ UPDATE (PATCH)
# ─────────────────────────────
@router.patch("/{receipt_id}", response_model=schemas.ReceiptRead)
def update_receipt(receipt_id: str, payload: schemas.ReceiptUpdate, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).filter_by(
        id=receipt_id, deleted=False).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(receipt, key, value)

    db.commit()
    db.refresh(receipt)
    return receipt


# ─────────────────────────────
# 5️⃣ SOFT DELETE
# ─────────────────────────────
@router.delete("/{receipt_id}")
def soft_delete_receipt(receipt_id: str, db: Session = Depends(get_db)):
    receipt = db.query(models.Receipt).filter_by(
        id=receipt_id, deleted=False).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt.deleted = True
    db.commit()
    return {"message": "Receipt marked as deleted", "receipt_id": receipt_id}
