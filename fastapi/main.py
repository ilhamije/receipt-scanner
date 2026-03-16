"""
Receipt Scanner API — Self-contained FastAPI application.

Flow:
  1. Upload / take photo  →  POST /receipts/scan
  2. Detect if it's a receipt
  3. Extract text via OCR (GPT-4o-mini vision)
  4. Parse text into structured JSON
  5. Save to MongoDB

Data is automatically purged at midnight (configurable timezone).
"""

import os
import base64
import json
import uuid
from datetime import datetime, time as dt_time
from contextlib import asynccontextmanager
from typing import Optional, List

from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
from motor.motor_asyncio import AsyncIOMotorClient
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

# ─────────────────────────────────────────────
# 🔧  Configuration
# ─────────────────────────────────────────────
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "receipt_scanner")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
TIMEZONE = os.getenv("TIMEZONE", "Asia/Jakarta")  # UTC+7

COLLECTION = "receipts"


# ─────────────────────────────────────────────
# 🗑️  Midnight Cleanup Job
# ─────────────────────────────────────────────
async def purge_receipts_at_midnight():
    """Delete all receipt documents from MongoDB. Runs at 00:00 local time."""
    db = get_db()
    result = await db[COLLECTION].delete_many({})
    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz).isoformat()
    print(f"🗑️  [{now}] Midnight cleanup: removed {result.deleted_count} receipts.")


# ─────────────────────────────────────────────
# 🏗️  App Lifespan (startup / shutdown)
# ─────────────────────────────────────────────
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    # Schedule the midnight purge in the configured timezone
    tz = pytz.timezone(TIMEZONE)
    scheduler.add_job(
        purge_receipts_at_midnight,
        CronTrigger(hour=0, minute=0, timezone=tz),
        id="midnight_purge",
        replace_existing=True,
    )
    scheduler.start()
    print(f"⏰  Midnight purge scheduled (timezone: {TIMEZONE})")

    yield

    # ── Shutdown ──
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="Receipt Scanner API",
    description="Upload a receipt photo → detect, extract, parse, and save to MongoDB.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve static files (CSS, JS) ──
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def serve_frontend():
    """Serve the frontend index.html."""
    return FileResponse(str(STATIC_DIR / "index.html"))


# ─────────────────────────────────────────────
# 🔌  Clients (lazy singletons)
# ─────────────────────────────────────────────
_openai_client: Optional[OpenAI] = None
_mongo_client: Optional[AsyncIOMotorClient] = None


def get_openai() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not set.")
        _openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


def get_db():
    """Return the MongoDB database instance."""
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(MONGODB_URI)
    return _mongo_client[MONGODB_DB]


# ─────────────────────────────────────────────
# 📦  Pydantic Schemas
# ─────────────────────────────────────────────
class ReceiptItem(BaseModel):
    name: str
    quantity: int = 1
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    category: Optional[str] = None


class ReceiptData(BaseModel):
    id: Optional[str] = None
    vendor: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    items: List[ReceiptItem] = []
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    payment_method: Optional[str] = None
    currency: str = "IDR"
    category: Optional[str] = None
    notes: Optional[str] = None
    raw_text: Optional[str] = None
    source_image: Optional[str] = None
    status: str = "parsed"
    created_at: Optional[str] = None


class ReceiptUpdate(BaseModel):
    vendor: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    expense_date: Optional[str] = None
    items: Optional[List[dict]] = None


class ScanResponse(BaseModel):
    success: bool
    message: str
    receipt: Optional[ReceiptData] = None


class PaginatedReceipts(BaseModel):
    total: int
    limit: int
    offset: int
    results: List[dict]


# ─────────────────────────────────────────────
# 🤖  OpenAI Helpers
# ─────────────────────────────────────────────
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}


async def detect_receipt(file_bytes: bytes, mime: str) -> bool:
    """
    Use GPT-4o-mini vision to determine whether the image is a receipt.
    Returns True if it is a receipt, False otherwise.
    """
    client = get_openai()
    data_uri = f"data:{mime};base64,{base64.b64encode(file_bytes).decode()}"

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0,
        max_tokens=10,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an image classifier. "
                    "Determine if the given image is a receipt or purchase invoice. "
                    "Respond with ONLY 'yes' or 'no'."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Is this image a receipt?"},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            },
        ],
    )

    answer = response.choices[0].message.content.strip().lower()
    return answer.startswith("yes")


async def extract_receipt_text(file_bytes: bytes, filename: str, mime: str) -> str:
    """
    OCR: Extract all readable text from the receipt image using GPT-4o-mini vision.
    """
    client = get_openai()
    data_uri = f"data:{mime};base64,{base64.b64encode(file_bytes).decode()}"

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an OCR assistant. Extract all readable text from this receipt image "
                    "without translation, explanation, or JSON — only plain text."
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"Extract text from this receipt: {filename}"},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            },
        ],
    )

    return response.choices[0].message.content.strip()


async def parse_receipt_to_json(ocr_text: str) -> dict:
    """
    Parse the extracted OCR text into structured receipt JSON.
    """
    client = get_openai()

    prompt = {
        "instructions": (
            "Extract structured data from the following receipt text. "
            "Focus on expense tracking. Preserve numeric precision and item details. "
            "Respond ONLY with valid JSON, following the schema below."
        ),
        "output_format": {
            "vendor": "string",
            "address": "string or null",
            "phone": "string or null",
            "date": "string (YYYY-MM-DD or null)",
            "time": "string (HH:MM:SS or null)",
            "items": [
                {
                    "name": "string",
                    "quantity": "integer",
                    "unit_price": "float or null",
                    "total_price": "float",
                    "category": "string (e.g. food, beverage, grocery, transport, etc.)",
                }
            ],
            "subtotal": "float or null",
            "tax": "float or null",
            "total": "float",
            "payment_method": "string or null",
            "currency": "string (default IDR)",
            "category": "string — overall category of purchase (e.g. dining, grocery, transport)",
            "notes": "string or null",
        },
        "text_to_parse": ocr_text,
    }

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": "You are a precise OCR-to-JSON parser for receipts.",
            },
            {"role": "user", "content": json.dumps(prompt)},
        ],
    )

    content = response.choices[0].message.content.strip()

    # Strip markdown code fences if present
    if content.startswith("```"):
        lines = content.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        content = "\n".join(lines)

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse JSON from OpenAI output.",
        )


# ─────────────────────────────────────────────
# 🚀  API Endpoints
# ─────────────────────────────────────────────

# ── Health ───────────────────────────────────
@app.get("/health")
async def health_check():
    """Quick health / readiness probe."""
    db = get_db()
    try:
        await db.command("ping")
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"error: {e}"

    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)

    return {
        "api": "ok",
        "mongodb": mongo_status,
        "openai_configured": bool(OPENAI_API_KEY),
        "server_time": now.isoformat(),
        "next_purge": "midnight " + TIMEZONE,
    }


# ── 1. Scan Receipt (upload → detect → extract → parse → save) ──
@app.post("/receipts/scan", response_model=ScanResponse)
async def scan_receipt(file: UploadFile = File(...)):
    """
    Full pipeline:
      1. Validate the uploaded file
      2. Detect if it's a receipt
      3. Extract text (OCR)
      4. Parse into structured JSON
      5. Save to MongoDB
    """
    # ── Validate MIME type ──
    mime = file.content_type or "image/jpeg"
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {mime}. Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Step 1: Detect if receipt ──
    is_receipt = await detect_receipt(file_bytes, mime)

    if not is_receipt:
        return ScanResponse(
            success=False,
            message="Please upload a proper receipt. The uploaded image does not appear to be a receipt.",
            receipt=None,
        )

    # ── Step 2: Extract text (OCR) ──
    try:
        raw_text = await extract_receipt_text(file_bytes, file.filename or "receipt.jpg", mime)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {e}")

    # ── Step 3: Parse to structured JSON ──
    try:
        parsed = await parse_receipt_to_json(raw_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Receipt parsing failed: {e}")

    # ── Step 4: Enrich & Save to MongoDB ──
    receipt_id = str(uuid.uuid4())
    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)

    parsed["id"] = receipt_id
    parsed["raw_text"] = raw_text
    parsed["source_image"] = file.filename
    parsed["status"] = "parsed"
    parsed["created_at"] = now.isoformat()
    parsed["deleted"] = False

    db = get_db()
    # Use our own `id` as the Mongo `_id` for simplicity
    doc = {**parsed, "_id": receipt_id}
    await db[COLLECTION].insert_one(doc)

    return ScanResponse(
        success=True,
        message="Receipt scanned and saved successfully.",
        receipt=ReceiptData(**parsed),
    )


# ── 2. List Receipts ────────────────────────
@app.get("/receipts", response_model=PaginatedReceipts)
async def list_receipts(
    vendor: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all saved receipts with optional filters."""
    db = get_db()

    query_filter: dict = {"deleted": False}

    if vendor:
        query_filter["vendor"] = {"$regex": vendor, "$options": "i"}
    if category:
        query_filter["category"] = category
    if min_amount is not None or max_amount is not None:
        amount_filter = {}
        if min_amount is not None:
            amount_filter["$gte"] = min_amount
        if max_amount is not None:
            amount_filter["$lte"] = max_amount
        query_filter["total"] = amount_filter

    total = await db[COLLECTION].count_documents(query_filter)
    cursor = (
        db[COLLECTION]
        .find(query_filter, {"_id": 0})
        .sort("created_at", -1)
        .skip(offset)
        .limit(limit)
    )
    results = await cursor.to_list(length=limit)

    return PaginatedReceipts(total=total, limit=limit, offset=offset, results=results)


# ── 3. Get Single Receipt ───────────────────
@app.get("/receipts/{receipt_id}")
async def get_receipt(receipt_id: str):
    """Retrieve a single receipt by ID."""
    db = get_db()

    doc = await db[COLLECTION].find_one(
        {"id": receipt_id, "deleted": False}, {"_id": 0}
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Receipt not found.")

    return doc


# ── 4. Update Receipt ───────────────────────
@app.patch("/receipts/{receipt_id}")
async def update_receipt(receipt_id: str, payload: ReceiptUpdate):
    """Update editable fields of a receipt."""
    db = get_db()

    existing = await db[COLLECTION].find_one(
        {"id": receipt_id, "deleted": False}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Receipt not found.")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    await db[COLLECTION].update_one(
        {"id": receipt_id},
        {"$set": updates},
    )

    updated = await db[COLLECTION].find_one({"id": receipt_id}, {"_id": 0})
    return updated


# ── 5. Delete Receipt (soft) ────────────────
@app.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: str):
    """Soft-delete a receipt."""
    db = get_db()

    existing = await db[COLLECTION].find_one(
        {"id": receipt_id, "deleted": False}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Receipt not found.")

    await db[COLLECTION].update_one(
        {"id": receipt_id},
        {"$set": {"deleted": True}},
    )

    return {"message": "Receipt deleted.", "receipt_id": receipt_id}


# ── 6. Manual Purge (admin) ─────────────────
@app.delete("/admin/purge")
async def manual_purge():
    """
    Manually trigger the midnight purge (deletes ALL receipts).
    Useful for testing or manual cleanup.
    """
    db = get_db()
    result = await db[COLLECTION].delete_many({})
    return {
        "message": f"Purged {result.deleted_count} receipts.",
        "deleted_count": result.deleted_count,
    }
