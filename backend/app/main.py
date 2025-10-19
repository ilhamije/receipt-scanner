from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app import receipts


# ─────────────────────────────
# ✅ App Initialization
# ─────────────────────────────
app = FastAPI(title="Receipt Scanner API")
app.include_router(receipts.router)

# ─────────────────────────────
# ✅ CORS Configuration
# ─────────────────────────────
origins = [
    "http://localhost:5173",      # Vite dev server
    "http://127.0.0.1:5173",      # alternate localhost
    "http://localhost",           # root for some browsers
    "http://frontend",            # Docker service name (if used)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # or ["*"] for dev-only wildcard
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


# ─────────────────────────────
# ✅ Health check endpoint
# ─────────────────────────────
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and DB connectivity.
    """
    try:
        # simple DB query to ensure connection is alive
        db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "ok", "database": f"error: {str(e)}"}
