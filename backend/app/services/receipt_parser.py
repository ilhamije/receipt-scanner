import re
from datetime import datetime
from typing import Dict, Any


def parse_receipt_text(text: str, source_image: str = "") -> Dict[str, Any]:
    """Generic parser for Indonesian receipts."""
    data: Dict[str, Any] = {
        "vendor": {"name": None, "branch": None, "address": None, "npwp": None},
        "cashier": None,
        "transaction": {
            "invoice_no": None,
            "date": None,
            "items": [],
            "summary": {
                "total_items": None,
                "total_discount": 0,
                "total_amount": None,
                "currency": "IDR",
                "payment_method": None,
                "change": None,
                "dpp": None,
                "ppn": None,
            },
        },
        "meta": {"source_image": source_image, "parse_confidence": None},
    }

    # Vendor detection
    lower = text.lower()
    if "alfamidi" in lower:
        data["vendor"]["name"] = "Alfamidi"
    elif "indomaret" in lower:
        data["vendor"]["name"] = "Indomaret"

    # Date
    match_date = re.search(r"(\d{2}-\d{2}-\d{4})", text)
    if match_date:
        try:
            data["transaction"]["date"] = datetime.strptime(
                match_date.group(1), "%d-%m-%Y"
            ).isoformat()
        except ValueError:
            pass

    # Totals
    total_match = re.search(r"Total\s*Belanja\s*([\d,]+)", text, re.IGNORECASE)
    if total_match:
        data["transaction"]["summary"]["total_amount"] = int(
            total_match.group(1).replace(",", "")
        )

    disc_match = re.search(r"Total\s*Disc.*?([\d,]+)", text, re.IGNORECASE)
    if disc_match:
        data["transaction"]["summary"]["total_discount"] = int(
            disc_match.group(1).replace(",", "")
        )

    # Simple NPWP capture
    npwp_match = re.search(r"NPWP\s*[: ]*\s*([\d\.\-]+)", text)
    if npwp_match:
        data["vendor"]["npwp"] = npwp_match.group(1)

    return data
