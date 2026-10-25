from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class CategoryBreakdownItem(BaseModel):
    category: str
    count: int
    percentage: float


class StatusBreakdownItem(BaseModel):
    status: str
    count: int


class AreaHotspotItem(BaseModel):
    area_id: Optional[int]
    area_name: str
    report_count: int
    percentage: float
    severity_level: str  # 'CRITICAL' | 'ELEVATED' | 'NORMAL'


class ResolutionMetrics(BaseModel):
    total_resolved: int
    avg_resolution_days: float
    median_resolution_days: float


class EngagementMetrics(BaseModel):
    total_claims_awarded: int
    total_points_distributed: int
    active_initiatives_count: int


class DecisionSupportInsight(BaseModel):
    title: str
    level: str  # 'CRITICAL' | 'WARNING' | 'POSITIVE' | 'NEUTRAL'
    observation: str
    recommendation: str


class AnalyticsOverviewResponse(BaseModel):
    total_reports: int
    open_reports: int
    resolved_reports: int
    resolution_rate_pct: float
    category_distribution: List[CategoryBreakdownItem]
    status_distribution: List[StatusBreakdownItem]
    area_hotspots: List[AreaHotspotItem]
    resolution_performance: ResolutionMetrics
    community_engagement: EngagementMetrics
    decision_insights: List[DecisionSupportInsight]
    procedure_step: str = "Step 6: Visual Indicators & Decision Support"
    generated_at: datetime
