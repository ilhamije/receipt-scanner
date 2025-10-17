# app/routers/expenses.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.db import get_db

router = APIRouter()


@router.get("/", response_model=list[schemas.ExpenseRead])
def list_expenses(db: Session = Depends(get_db)):
    return db.query(models.Expense).all()
