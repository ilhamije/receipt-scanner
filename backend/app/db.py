from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv


def get_database_url() -> str:
    """Lazily load .env and return DATABASE_URL."""
    load_dotenv()  # ensures .env is read even if main.py hasn't run yet
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL not set in environment variables.")
    return db_url


# Initialize engine only when needed
def get_engine():
    """Return a SQLAlchemy engine instance."""
    return create_engine(get_database_url())


# Global declarative base (safe to define early)
Base = declarative_base()


# Dependency for FastAPI routes
def get_db():
    """Yield a database session."""
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
