import os
import base64
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
    """Send image to OpenAI and return extracted text."""
    try:
        client = get_openai_client()

        # Proper base64 data URL for the vision model
        data_uri = f"data:{mime};base64,{base64.b64encode(file_bytes).decode()}"

        # Correct OpenAI API format (image_url is an object)
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
