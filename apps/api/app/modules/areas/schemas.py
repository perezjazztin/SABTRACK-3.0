from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# Base Pydantic schema defining shared area attributes and validation rules.
class AreaBase(BaseModel):
    code: str = Field(..., max_length=50, description="Unique area/zone identifier")
    name: str = Field(..., max_length=100, description="Display name for the area or purok")
    description: str | None = Field(default=None, description="Operational notes or landmarks")
    is_active: bool = Field(default=True, description="Whether the area is currently serviced")


# Request schema for creating a new administrative area or purok.
class AreaCreate(AreaBase):
    is_demo_data: bool = Field(default=False, description="Flag for synthetic test data")


# Response schema returning persisted area details; from_attributes allows direct ORM serialization.
class AreaRead(AreaBase):
    id: int
    is_demo_data: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
