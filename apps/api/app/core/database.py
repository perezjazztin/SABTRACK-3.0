from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.core.logging import logger


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""
    pass


# Engine with appropriate connect_args for PostgreSQL (timeout) or SQLite (threading)
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "psycopg" in settings.DATABASE_URL:
    connect_args = {"connect_timeout": 3}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """Database session dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connectivity() -> Dict[str, Any]:
    """Safely checks if the PostgreSQL database is reachable.
    
    Returns non-sensitive connectivity status.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            return {"connected": True, "detail": "PostgreSQL operational"}
    except SQLAlchemyError as exc:
        logger.warning("Database connectivity check failed: %s", str(exc).split("\n")[0])
        return {"connected": False, "detail": "PostgreSQL unreachable"}
    except Exception as exc:
        logger.warning("Unexpected error during DB check: %s", str(exc).split("\n")[0])
        return {"connected": False, "detail": "Database check failed"}
