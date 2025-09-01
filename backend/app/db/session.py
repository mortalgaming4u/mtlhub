import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Replace with your real database URL or env var
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./test.db",  # fallback for local dev
)

# Create the SQLAlchemy engine
# For SQLite, enable check_same_thread; remove connect_args for Postgres/MySQL
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {},
)

# Each instance of SessionLocal will be a database session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for all your ORM models
Base = declarative_base()


def get_db():
    """
    Dependency for FastAPI routes.
    Yields a SQLAlchemy Session, and ensures it’s closed when done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
