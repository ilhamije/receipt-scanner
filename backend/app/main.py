from fastapi import FastAPI
from app.routers import upload, expenses
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="Receipt Scanner API")

# Register routers
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(expenses.router, prefix="/expenses", tags=["expenses"])

@app.get("/")
def root():
    return {"message": "Receipt Scanner API is running 🚀"}
