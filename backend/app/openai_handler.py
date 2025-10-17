# app/ai/openai_handler.py
import os
import base64
import json
from fastapi import HTTPException
from openai import OpenAI
from dotenv import load_dotenv


def get_openai_client() -> OpenAI:
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)


async def extract_receipt_text(file_bytes: bytes, filename: str, mime: str = "image/jpeg") -> str:
    """
    Extracts all readable text from an uploaded receipt image using GPT-4o-mini.
    Returns plain text (no formatting or JSON).
    """
    try:
        client = get_openai_client()

        data_uri = f"data:{mime};base64,{base64.b64encode(file_bytes).decode()}"

        response = client.chat.completions.create(
            model="gpt-4o-mini",
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
                        {"type": "text",
                            "text": f"Extract text from this receipt: {filename}"},
                        {"type": "image_url", "image_url": {"url": data_uri}},
                    ],
                },
            ],
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI OCR failed: {e}")


async def parse_receipt_to_json(ocr_text: str) -> dict:
    """
    Converts OCR text into structured JSON with vendor, items, totals, and metadata.
    Uses GPT-4o-mini for consistent JSON extraction.
    """
    try:
        client = get_openai_client()

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
                "table_number": "string or null",
                "items": [
                    {
                        "name": "string",
                        "quantity": "integer",
                        "unit_price": "float or null",
                        "total_price": "float",
                        "category": "string"
                    }
                ],
                "subtotal": "float or null",
                "tax": "float or null",
                "total": "float",
                "payment_method": "string or null",
                "currency": "string (default IDR)",
                "notes": "string or null"
            },
            "text_to_parse": ocr_text
        }

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            messages=[
                {"role": "system",
                    "content": "You are a precise OCR-to-JSON parser for receipts."},
                {"role": "user", "content": json.dumps(prompt)},
            ],
        )

        content = response.choices[0].message.content.strip()

        # Ensure valid JSON
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500, detail="Failed to parse JSON from OpenAI output.")

        return parsed

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"OpenAI JSON parsing failed: {e}")
