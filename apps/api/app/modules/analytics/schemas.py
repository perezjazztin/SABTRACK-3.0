from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


# Breakdown item schema showing category frequency and share percentage.
class CategoryBreakdownItem(BaseModel):
    category: str
    count: int
    percentage: float


# Breakdown item schema showing report count per status.
class StatusBreakdownItem(BaseModel):
    status: str
    count: int


# Area hotspot metric identifying geographic clusters with elevated waste incidents.
class AreaHotspotItem(BaseModel):
    area_id: Optional[int]
    area_name: str
    report_count: int
    percentage: float
    severity_level: str  # 'CRITICAL' | 'ELEVATED' | 'NORMAL'


# Resolution performance metrics calculating resolution rates and turnaround days.
class ResolutionMetrics(BaseModel):
    total_resolved: int
    avg_resolution_days: float
    median_resolution_days: float


# Civic engagement metrics summarizing points distributed and community participation.
class EngagementMetrics(BaseModel):
    total_claims_awarded: int
    total_points_distributed: int
    active_initiatives_count: int


# Rule-based decision support insight highlighting operational bottlenecks.
class DecisionSupportInsight(BaseModel):
    title: str
    level: str  # 'CRITICAL' | 'WARNING' | 'POSITIVE' | 'NEUTRAL'
    observation: str
    recommendation: str


# -------------------------------------------------------------
# Descriptive Analytics Schema Elements (Historical Aggregates)
# -------------------------------------------------------------
# Daily time-series count of submitted versus resolved reports.
class TrendDataPoint(BaseModel):
    date: str  # YYYY-MM-DD
    submitted_count: int
    resolved_count: int


# Aggregated descriptive analytics schema summarizing historical operations.
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
# Purok-level 7-day risk forecasting and proactive dispatch recommendation.
class AreaRiskForecastItem(BaseModel):
    area_id: Optional[int]
    area_name: str
    historical_count: int
    predicted_weekly_incidents: float
    overflow_probability_pct: float
    risk_level: str  # 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK'
    predicted_dominant_category: str
    proactive_dispatch_action: str


# Predictive analytics forecast schema computed using linear trend regression.
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
# Combined analytics payload delivered to administrative dashboard.
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


# -------------------------------------------------------------
# AI-Assisted Decision Support Narrative Briefing Schema
# -------------------------------------------------------------
# Executive narrative summary generated via Gemini for barangay leadership.
class NarrativeSummaryResponse(BaseModel):
    title: str
    executive_summary: str
    key_findings: List[str]
    recommended_actions: List[str]
    model_used: str
    generated_at: datetime
    governance_disclaimer: str
    metrics_snapshot: dict
