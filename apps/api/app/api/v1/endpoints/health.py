from datetime import datetime, timezone
from fastapi import APIRouter, status
from pydantic import BaseModel
from app.core.config import settings
from app.core.database import check_db_connectivity

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: datetime
    database: str


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System and database health check",
    description="Returns a non-sensitive health check status and database connectivity indicator."
)
def get_health() -> HealthResponse:
    db_check = check_db_connectivity()
    db_status = "connected" if db_check.get("connected") else "disconnected"
    overall_status = "ok" if db_status == "connected" else "degraded"

    return HealthResponse(
        status=overall_status,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=db_status,
    )
