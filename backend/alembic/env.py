from app.db import Base, get_engine, get_database_url
from dotenv import load_dotenv
import os
import sys
from logging.config import fileConfig
from alembic import context
from sqlalchemy import pool

# 1) Make sure the project root (where `app/` lives) is importable
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# 2) Load .env so DATABASE_URL is available
load_dotenv()

# 3) Import your app models & DB helpers (lazy engine/url)
from app import models  # noqa: F401  (ensure models are imported for autogenerate)

# Alembic config & logging
config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection."""
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # detect column type changes too
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations with a live DB connection."""
    engine = get_engine()
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
