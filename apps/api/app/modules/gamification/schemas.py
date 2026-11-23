from datetime import datetime
from typing import Optional, List, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from app.modules.gamification.models import (
    ClaimActivityType,
    ClaimStatus,
    RedemptionStatus,
    TransactionType,
)


# Request payload for barangay staff creating a new points-eligible initiative.
class InitiativeCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150, description="Initiative or clean-up title")
    description: str = Field(..., min_length=10, max_length=2000, description="Details and instructions")
    points_reward: int = Field(default=50, ge=5, le=500, description="Points awarded for verified attendance")
    event_date: str = Field(..., min_length=4, max_length=50, description="Date of the event")
    location: str = Field(..., min_length=3, max_length=150, description="Meeting place or designated sector")


# Response representation of an active community initiative.
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


# Resident request to claim points for segregation or cleanup attendance.
class ClaimCreate(BaseModel):
    initiative_id: Optional[int] = Field(None, description="Optional associated initiative ID")
    activity_title: str = Field(..., min_length=5, max_length=150, description="Summary of civic action performed")
    description: str = Field(..., min_length=10, max_length=2000, description="Detailed account of work and segregation")
    evidence_url: Optional[str] = Field(None, max_length=512, description="Photo proof URL or simulated upload")
    activity_type: ClaimActivityType = Field(default=ClaimActivityType.OTHER)
    points_requested: int = Field(default=25, ge=5, le=500, description="Points requested based on initiative")


# Staff review action payload approving or rejecting a resident claim.
class ClaimReviewPayload(BaseModel):
    status: ClaimStatus = Field(..., description="Approved or Rejected")
    review_notes: Optional[str] = Field(None, max_length=1000, description="Official verification remarks")
    points_awarded: Optional[int] = Field(None, ge=1, le=500, description="Custom points override if approved")


# Serialized claim response including reviewer information and status.
class ClaimRead(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    initiative_id: Optional[int] = None
    initiative_title: Optional[str] = None
    activity_title: str
    description: str
    evidence_url: Optional[str] = None
    activity_type: ClaimActivityType = ClaimActivityType.OTHER
    points_requested: int
    status: ClaimStatus
    reviewed_by_name: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Detailed ledger transaction record returned in resident points history.
class PointsLedgerRead(BaseModel):
    id: int
    points: int
    transaction_type: TransactionType
    description: str
    task_key: Optional[str] = None
    task_source_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Aggregated summary returned to resident portal showing net points balance and tier.
class ResidentPointsSummary(BaseModel):
    total_points: int
    tier: str
    verified_activities_count: int
    ledger_history: List[PointsLedgerRead]
    recent_claims: List[ClaimRead]


# Catalog item available for reward redemption.
class RewardItemRead(BaseModel):
    id: int
    name: str
    description: str
    points_required: int
    category: str
    stock_quantity: int
    image_url: Optional[str] = None
    is_active: bool
    is_demo_data: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Request schema for redeeming an available reward item.
class RedemptionCreate(BaseModel):
    reward_id: int = Field(..., description="ID of reward item to redeem")


# Staff review payload for approving or fulfilling a voucher redemption.
class RedemptionReviewPayload(BaseModel):
    status: RedemptionStatus = Field(..., description="Requested review transition")
    review_notes: Optional[str] = Field(None, max_length=1000, description="Official review remarks")


# Serialized redemption request including voucher claim code and fulfillment status.
class RedemptionRequestRead(BaseModel):
    id: int
    resident_id: int
    resident_name: str
    reward_id: int
    reward_name: str
    points_spent: int
    claim_code: str
    status: RedemptionStatus
    review_notes: Optional[str] = None
    fulfilled_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Actionable civic task card definition for resident dashboard.
class CivicTaskItem(BaseModel):
    id: str
    title: str
    description: str
    points_reward: int
    category: str
    status: str
    progress_current: int
    progress_target: int
    is_repeatable: bool
    action_type: str
    image_url: Optional[str] = None


# Purok leaderboard ranking entry for gamification competition.
class LeaderboardEntry(BaseModel):
    rank: int
    resident_id: int
    display_name: str
    purok_name: str
    total_points: int
    tier: str
    verified_activities_count: int
    is_current_user: bool


class ArticleReadingOpenRequest(BaseModel):
    article_id: str = Field(..., min_length=1, max_length=100)


class ArticleReadingSessionRead(BaseModel):
    article_id: str
    session_id: Optional[UUID] = None
    opened_at: Optional[datetime] = None
    already_read: bool


class ArticleReadingStatus(BaseModel):
    completed_article_ids: List[str]
    awards_today: int
    daily_limit: int
    points_per_article: int
    minimum_read_seconds: int


class AwarenessStatusResponse(BaseModel):
    resource_points: dict[str, int]
    daily_points_today: int
    daily_limit: int = 20
    interval_seconds: int = 45
    max_points_per_resource: int = 5


class AwarenessHeartbeatRequest(BaseModel):
    resource_id: str = Field(..., min_length=1, max_length=100)
    session_id: Optional[UUID] = None


class AwarenessHeartbeatResponse(BaseModel):
    resource_id: str
    status: Literal["AWARDED", "RESOURCE_CAP_REACHED", "DAILY_LIMIT_REACHED"]
    points_awarded: int
    points_earned: int
    max_points: int = 5
    daily_points_today: int
    daily_limit: int = 20
    total_points: Optional[int] = None


class ArticleReadingCompleteRequest(BaseModel):
    session_id: UUID


class ArticleReadingCompletion(BaseModel):
    article_id: str
    status: Literal["AWARDED", "ALREADY_READ", "DAILY_LIMIT_REACHED"]
    points_awarded: int
    awards_today: int
