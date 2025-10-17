from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app import receipts

app = FastAPI(title="Receipt Scanner API")

# include your receipts router
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
        # simple DB query to ensure connection is alive
        db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "ok", "database": f"error: {str(e)}"}
