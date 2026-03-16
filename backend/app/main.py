import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app import receipts


# ─────────────────────────────
# ✅ App Initialization
# ─────────────────────────────
app = FastAPI(title="Receipt Scanner API")

# ─────────────────────────────
# ✅ CORS Configuration
# ─────────────────────────────
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost",
]

# Allow adding production origins via env var (comma-separated)
# Example: CORS_ORIGINS=https://receipt-scanner-xyz.vercel.app,https://my-domain.com
extra_origins = os.getenv("CORS_ORIGINS", "").split(",")
extra_origins = [o.strip() for o in extra_origins if o.strip()]

origins = default_origins + extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────
# ✅ Routers
# ─────────────────────────────
app.include_router(receipts.router)


# ─────────────────────────────
# ✅ Health check endpoint
# ─────────────────────────────
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and DB connectivity.
    """
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "ok", "database": f"error: {str(e)}"}



