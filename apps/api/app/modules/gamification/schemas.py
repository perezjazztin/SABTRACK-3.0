from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.modules.gamification.models import ClaimStatus, TransactionType


class InitiativeCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150, description="Initiative or clean-up title")
    description: str = Field(..., min_length=10, max_length=2000, description="Details and instructions")
    points_reward: int = Field(default=50, ge=5, le=500, description="Points awarded for verified attendance")
    event_date: str = Field(..., min_length=4, max_length=50, description="Date of the event")
    location: str = Field(..., min_length=3, max_length=150, description="Meeting place or designated sector")


class InitiativeRead(BaseModel):
    id: int
    title: str
    description: str
    points_reward: int
    event_date: str
    location: str
    is_active: bool
    is_demo_data: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClaimCreate(BaseModel):
    initiative_id: Optional[int] = Field(None, description="Optional associated initiative ID")
    activity_title: str = Field(..., min_length=5, max_length=150, description="Summary of civic action performed")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed account of work and segregation")
    evidence_url: Optional[str] = Field(None, max_length=512, description="Photo proof URL or simulated upload")
    points_requested: int = Field(default=25, ge=5, le=500, description="Points requested based on initiative")


class ClaimReviewPayload(BaseModel):
    status: ClaimStatus = Field(..., description="Approved or Rejected")
    review_notes: Optional[str] = Field(None, max_length=1000, description="Official verification remarks")
    points_awarded: Optional[int] = Field(None, ge=1, le=500, description="Custom points override if approved")


class ClaimRead(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    initiative_id: Optional[int] = None
    initiative_title: Optional[str] = None
    activity_title: str
    description: str
    evidence_url: Optional[str] = None
    points_requested: int
    status: ClaimStatus
    reviewed_by_name: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PointsLedgerRead(BaseModel):
    id: int
    points: int
    transaction_type: TransactionType
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResidentPointsSummary(BaseModel):
    total_points: int
    tier: str
    verified_activities_count: int
    ledger_history: List[PointsLedgerRead]
    recent_claims: List[ClaimRead]
