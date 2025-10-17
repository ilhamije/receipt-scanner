from app import models  # import models so Alembic can detect them
from app.db import Base, engine  # your SQLAlchemy engine + Base
import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Load .env if used
from dotenv import load_dotenv
load_dotenv()

# This will ensure your `app` package is importable
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))


# Interpret the config file for Python logging.
config = context.config
fileConfig(config.config_file_name)

# Get the DB URL from .env or Alembic override
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = os.getenv("DATABASE_URL")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine

    with connectable.connect() as connection:
        context.configure(connection=connection,
                          target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
