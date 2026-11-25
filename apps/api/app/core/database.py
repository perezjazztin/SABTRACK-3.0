from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.core.logging import logger


# Declarative base class from which all SQLAlchemy ORM models inherit table schemas.
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""
    pass


# Configures connection arguments: SQLite needs multithreading enabled, while PostgreSQL sets a connect timeout.
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "psycopg" in settings.DATABASE_URL:
    connect_args = {"connect_timeout": 3}

# Initializes the database engine; pool_pre_ping checks connection health before issuing queries.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# Factory for creating new database sessions with explicit transaction control.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Dependency generator yielding an active database session per request and closing it when the request finishes.
def get_db() -> Generator:
    """Database session dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        # Yields session instance to endpoint dependencies.
        yield db
    finally:
        # Ensures connection is released back to pool even if errors occur.
        db.close()


# Executes a lightweight SELECT 1 query to verify database health without exposing sensitive data.
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
