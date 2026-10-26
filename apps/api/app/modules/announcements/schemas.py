from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.modules.announcements.models import AnnouncementCategory


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, description="Headline of the announcement")
    content: str = Field(..., min_length=10, max_length=5000, description="Full markdown or text details")
    category: AnnouncementCategory = Field(default=AnnouncementCategory.GENERAL, description="Advisory topic")
    is_pinned: bool = Field(default=False, description="Whether to feature this at the top of the bulletin")


class AnnouncementRead(BaseModel):
    id: int
    title: str
    content: str
    category: AnnouncementCategory
    is_pinned: bool
    is_active: bool
    is_demo_data: bool
    author_id: int
    author_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnnouncementListResponse(BaseModel):
    items: List[AnnouncementRead]
    total: int
