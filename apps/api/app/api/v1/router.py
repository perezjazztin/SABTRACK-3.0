from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, protected_demo, reports

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(protected_demo.router, tags=["Protected Navigation"])
api_router.include_router(reports.router, prefix="/reports", tags=["Community Waste Reports"])
