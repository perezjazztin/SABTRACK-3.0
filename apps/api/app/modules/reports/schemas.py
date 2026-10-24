from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.modules.reports.models import ReportCategory, ReportStatus


class ReportCreate(BaseModel):
    category: ReportCategory = Field(..., description="Category of waste report")
    title: str = Field(..., min_length=5, max_length=200, description="Brief summary of issue")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed description")
    location_text: str = Field(..., min_length=3, max_length=255, description="Street, landmark, or purok description")
    area_id: Optional[int] = Field(None, description="Optional associated barangay area/purok ID")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="GPS Latitude")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="GPS Longitude")
    photo_url: Optional[str] = Field(None, max_length=512, description="Optional photo URL or base64 representation")


class ReportStatusUpdate(BaseModel):
    status: ReportStatus = Field(..., description="New report status")
    remarks: Optional[str] = Field(None, max_length=1000, description="Staff explanation or action taken")
    admin_notes: Optional[str] = Field(None, max_length=1000, description="Internal notes visible to staff/admin")


class StatusHistoryRead(BaseModel):
    id: int
    previous_status: Optional[str] = None
    new_status: str
    changed_by_name: str
    changed_by_role: str
    remarks: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportRead(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    category: ReportCategory
    title: str
    description: str
    location_text: str
    area_id: Optional[int] = None
    area_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_url: Optional[str] = None
    status: ReportStatus
    admin_notes: Optional[str] = None
    is_demo_data: bool
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistoryRead] = []

    model_config = ConfigDict(from_attributes=True)


class ReportListResponse(BaseModel):
    items: List[ReportRead]
    total: int
