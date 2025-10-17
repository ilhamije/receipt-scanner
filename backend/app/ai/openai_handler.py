import os
import base64
import json
from typing import Optional, Dict, Any

from fastapi import HTTPException
from openai import OpenAI
from dotenv import load_dotenv


def get_openai_client() -> OpenAI:
    """
    Lazily load .env and build the OpenAI client at call time (not import time).
    Prevents crashes when OPENAI_API_KEY isn't loaded yet.
    """
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Surface a clean 500 inside FastAPI instead of crashing at import time
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set.")
    return OpenAI(api_key=api_key)


def _infer_mime(filename: str, content_type: Optional[str]) -> str:
    """
    Infer a safe image MIME type using priority:
      1) Provided content_type if looks valid
      2) Filename extension mapping
      3) Fallback to image/jpeg
    """
    if content_type and content_type.startswith("image/"):
        return content_type

    ext = (filename.split(".")[-1] or "").lower()
    if ext in {"jpg", "jpeg"}:
        return "image/jpeg"
    if ext == "png":
        return "image/png"
    if ext == "webp":
        return "image/webp"
    if ext == "gif":
        return "image/gif"
    if ext == "bmp":
        return "image/bmp"
    if ext == "tiff":
        return "image/tiff"

    # (MVP choice) PDFs need page rendering—reject here for now.
    if ext == "pdf":
        raise HTTPException(
            status_code=415,
            detail="PDF not supported yet. Please upload an image (JPG/PNG/WEBP).",
        )

    # reasonable default
    return "image/jpeg"


def _b64_data_uri(file_bytes: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(file_bytes).decode('utf-8')}"


async def analyze_receipt(
    file_bytes: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyze a receipt image with OpenAI Vision and return structured JSON.
    Uses filename + proper MIME and never initializes OpenAI at import-time.
    """
    # Validate & build data URI
    mime = _infer_mime(filename, content_type)
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    data_uri = _b64_data_uri(file_bytes, mime)

    # Build prompt (include filename context)
    system_msg = (
        "You are an assistant that extracts structured expense data from receipt images. "
        "Respond ONLY with a compact JSON object containing these fields: "
        "vendor (string|null), amount (number|null), currency (string|null), "
        "expense_date (YYYY-MM-DD|string|null), category (string|null). "
        "If a field is unknown, use null. Do not include extra commentary."
    )

    user_text = (
        "Extract key fields from this receipt image. "
        f"Use the filename as additional context if helpful.\n"
        f"Filename: {filename}"
    )

    # Call OpenAI lazily
    client = get_openai_client()

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.0,
            messages=[
                {"role": "system", "content": system_msg},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_text},
                        {"type": "image_url", "image_url": data_uri},
                    ],
                },
            ],
        )

        raw = resp.choices[0].message.content or ""

        # Try to parse JSON strictly
        parsed: Dict[str, Any]
        try:
            parsed = json.loads(raw)
        except Exception:
            # Some models wrap JSON in backticks or prose—try to salvage
            raw_stripped = raw.strip()
            # naive bracket slicing fallback
            start = raw_stripped.find("{")
            end = raw_stripped.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    parsed = json.loads(raw_stripped[start: end + 1])
                except Exception:
                    parsed = {"_raw": raw_stripped}
            else:
                parsed = {"_raw": raw_stripped}

        # Ensure required keys exist (fill with None)
        for key in ("vendor", "amount", "currency", "expense_date", "category"):
            parsed.setdefault(key, None)

        return {
            "filename": filename,
            "mime": mime,
            "data": parsed,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"OpenAI API error: {str(e)}")
