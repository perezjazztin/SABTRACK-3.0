from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.modules.schedules.models import DayOfWeek, WasteType, AdvisoryType


class ScheduleCreate(BaseModel):
    area_id: int = Field(..., description="ID of the barangay area/purok")
    day_of_week: DayOfWeek = Field(..., description="Collection day of week")
    waste_type: WasteType = Field(..., description="Type of waste collected")
    start_time: str = Field(..., min_length=2, max_length=20, description="Collection window start (e.g. 06:00 AM)")
    end_time: str = Field(..., min_length=2, max_length=20, description="Collection window end (e.g. 09:00 AM)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional pickup guidance")


class ScheduleRead(BaseModel):
    id: int
    area_id: int
    area_name: Optional[str] = None
    area_code: Optional[str] = None
    day_of_week: DayOfWeek
    waste_type: WasteType
    start_time: str
    end_time: str
    notes: Optional[str] = None
    is_active: bool
    is_demo_data: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdvisoryCreate(BaseModel):
    area_id: Optional[int] = Field(None, description="Optional area ID (None = barangay-wide)")
    title: str = Field(..., min_length=3, max_length=150, description="Advisory headline")
    message: str = Field(..., min_length=5, max_length=2000, description="Advisory notice details")
    advisory_type: AdvisoryType = Field(default=AdvisoryType.DELAY, description="Type of schedule modification")
    effective_date: str = Field(..., min_length=4, max_length=30, description="Target date or date range")


class AdvisoryRead(BaseModel):
    id: int
    area_id: Optional[int] = None
    area_name: Optional[str] = None
    title: str
    message: str
    advisory_type: AdvisoryType
    effective_date: str
    created_by_name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScheduleListResponse(BaseModel):
    items: List[ScheduleRead]
    total: int


class AdvisoryListResponse(BaseModel):
    items: List[AdvisoryRead]
    total: int


class ScheduleNotificationRequest(BaseModel):
    email: Optional[str] = Field(None, max_length=255, description="Recipient email address for reminders")


class ScheduleNotificationResponse(BaseModel):
    message: str
    schedule_id: int
    recipient_email: str
    day_of_week: str
    waste_type: str
    collection_time: str
    area_name: Optional[str] = None
