from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.errors import (
    http_exception_handler,
    validation_exception_handler,
    database_exception_handler,
    global_exception_handler,
)
from app.api.v1.router import api_router

# Ensure all database models are registered in Base.metadata upon application initialization
import app.modules.areas.models  # noqa: F401
import app.modules.identity.models  # noqa: F401
import app.modules.identity_verification.models  # noqa: F401
import app.modules.reports.models  # noqa: F401
import app.modules.schedules.models  # noqa: F401
import app.modules.gamification.models  # noqa: F401
import app.modules.announcements.models  # noqa: F401


# Lifespan context manager runs startup tasks before requests are accepted and cleanup tasks on shutdown.
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    setup_logging()
    logger.info("Initializing %s v%s (%s)", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)
    try:
        # Ensures local filesystem directories exist for file uploads and offline email simulation.
        settings.STORAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("Storage uploads directory verified: %s", settings.STORAGE_UPLOAD_DIR)
        settings.STORAGE_EMAIL_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("Storage email directory verified: %s", settings.STORAGE_EMAIL_DIR)
    except Exception as exc:
        logger.error("Failed to initialize storage directory: %s", exc)
    yield
    # Shutdown logic executes when the application stops.
    logger.info("Shutting down %s", settings.PROJECT_NAME)


# Initializes the FastAPI application instance with OpenAPI documentation metadata and lifecycle management.
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware configured for local frontend origin to allow secure cross-origin requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Centralized Exception Handlers that map Python/SQLAlchemy errors to standardized JSON responses.
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Mounts the versioned API router under the /api/v1 prefix.
app.include_router(api_router, prefix=settings.API_V1_STR)

# Top-level /health route alias for load balancers and system monitoring (bypasses auth and docs schema).
from app.api.v1.endpoints.health import get_health
app.add_api_route("/health", get_health, methods=["GET"], tags=["Health"], include_in_schema=False)


# Root entrypoint providing API metadata and links for service discovery.
@app.get("/", tags=["Root"])
def root():
    """Root entrypoint providing API metadata and links."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_url": f"{settings.API_V1_STR}/health",
    }
