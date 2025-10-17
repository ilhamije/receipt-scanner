from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List, Optional
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
            print('ocr_text: ', ocr_text)

            parsed = await parse_receipt_to_json(ocr_text)
            print('parsed: ', parsed)

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
            print('receipt: ', receipt)

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
        # Save placeholder record
        new_receipt = models.Receipt(
            id=shortuuid.uuid(),
            data={"status": "processing", "source_image": file.filename},
        )
        print('receipt processed')
        db.add(new_receipt)
        db.commit()
        db.refresh(new_receipt)
        print('database stored')

        # Schedule OCR task
        print('scheduling the OCR')
        file_bytes = await file.read()
        background_tasks.add_task(
            process_receipt_ocr, db, file_bytes, file.filename, file.content_type, new_receipt.id)
        print('background task added')

        return new_receipt

    except Exception as e:
        print('the heck?')
        raise HTTPException(
            status_code=500, detail=f"Receipt upload failed: {e}")


# ─────────────────────────────
# 2️⃣ LIST (with filters)
# ─────────────────────────────
@router.get("/", response_model=List[schemas.ReceiptRead])
def list_receipts(
    db: Session = Depends(get_db),
    vendor: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    include_deleted: bool = Query(False),
):
    query = db.query(models.Receipt)
    if not include_deleted:
        query = query.filter(models.Receipt.deleted == False)
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
    return query.order_by(models.Receipt.created_at.desc()).all()


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
