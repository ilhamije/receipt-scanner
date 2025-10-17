import mimetypes
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.db import get_db
from app.ai.openai_handler import extract_receipt_text
from app.services.receipt_parser import parse_receipt_text
from app.models import Receipt, Expense

router = APIRouter()


@router.post("", include_in_schema=False)
@router.post("/")
async def upload_receipt(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        contents = await file.read()
        mime = file.content_type or mimetypes.guess_type(file.filename)[
            0] or "image/jpeg"

        # 1️⃣ Extract text from image
        extracted_text = await extract_receipt_text(contents, file.filename, mime)

        # 2️⃣ Parse into structured JSON
        parsed = parse_receipt_text(extracted_text, source_image=file.filename)

        # 3️⃣ Store full JSON in Receipts
        receipt = Receipt(data=parsed)
        db.add(receipt)
        db.commit()
        db.refresh(receipt)

        # 4️⃣ Auto-create Expense entry
        txn = parsed.get("transaction", {})
        summary = txn.get("summary", {})

        expense = Expense(
            vendor=parsed.get("vendor", {}).get("name"),
            amount=summary.get("total_amount") or 0,
            currency=summary.get("currency", "IDR"),
            expense_date=datetime.fromisoformat(txn["date"])
            if txn.get("date")
            else None,
            category=None,
            receipt_id=receipt.id,
        )

        db.add(expense)
        db.commit()
        db.refresh(expense)

        return JSONResponse(
            content={
                "filename": file.filename,
                "receipt_id": receipt.id,
                "expense_id": expense.id,
                "message": "Receipt processed and stored successfully",
                "parsed": parsed,
            },
            status_code=200,
        )

    except Exception as e:
        db.rollback()
        print(e)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    finally:
        await file.close()
