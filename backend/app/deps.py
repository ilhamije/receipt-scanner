from fastapi import Depends, HTTPException
from app.db import get_db
from sqlalchemy.orm import Session


def get_current_user():
    # Stub for now — integrate Supabase Auth later
    return {"id": "demo-user"}
