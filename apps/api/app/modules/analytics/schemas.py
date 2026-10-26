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


# -------------------------------------------------------------
# Descriptive Analytics Schema Elements (Historical Aggregates)
# -------------------------------------------------------------
class TrendDataPoint(BaseModel):
    date: str  # YYYY-MM-DD
    submitted_count: int
    resolved_count: int


class DescriptiveAnalytics(BaseModel):
    total_reports: int
    open_reports: int
    resolved_reports: int
    resolution_rate_pct: float
    avg_resolution_days: float
    median_resolution_days: float
    total_claims_awarded: int
    total_points_distributed: int
    active_initiatives_count: int
    category_distribution: List[CategoryBreakdownItem]
    status_distribution: List[StatusBreakdownItem]
    area_hotspots: List[AreaHotspotItem]
    daily_operational_trend: List[TrendDataPoint]


# -------------------------------------------------------------
# Predictive Analytics Schema Elements (Forecasts & Outlook)
# -------------------------------------------------------------
class AreaRiskForecastItem(BaseModel):
    area_id: Optional[int]
    area_name: str
    historical_count: int
    predicted_weekly_incidents: float
    overflow_probability_pct: float
    risk_level: str  # 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK'
    predicted_dominant_category: str
    proactive_dispatch_action: str


class PredictiveAnalytics(BaseModel):
    forecast_horizon_days: int = 7
    trend_direction: str  # 'UPWARD' | 'DOWNWARD' | 'STABLE'
    projected_weekly_reports: float
    projected_change_pct: float
    backlog_clearance_eta_days: float
    projected_truck_runs_needed: int
    area_risk_forecasts: List[AreaRiskForecastItem]
    model_methodology: str = "Linear Trend Regression with 7-Day Moving Window & Bayesian Prior"


# -------------------------------------------------------------
# Top-Level Business Analytics Response
# -------------------------------------------------------------
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
    descriptive: DescriptiveAnalytics
    predictive: PredictiveAnalytics
