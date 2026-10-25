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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    setup_logging()
    logger.info("Initializing %s v%s (%s)", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)
    try:
        settings.STORAGE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("Storage uploads directory verified: %s", settings.STORAGE_UPLOAD_DIR)
    except Exception as exc:
        logger.error("Failed to initialize storage directory: %s", exc)
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS Middleware configured for local frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Centralized Exception Handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Include versioned API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Top-level /health route alias for load balancers and system monitoring
from app.api.v1.endpoints.health import get_health
app.add_api_route("/health", get_health, methods=["GET"], tags=["Health"], include_in_schema=False)


@app.get("/", tags=["Root"])
def root():
    """Root entrypoint providing API metadata and links."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_url": f"{settings.API_V1_STR}/health",
    }
