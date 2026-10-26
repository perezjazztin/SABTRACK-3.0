export interface CategoryBreakdownItem {
  category: string;
  count: number;
  percentage: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
}

export interface AreaHotspotItem {
  area_id: number | null;
  area_name: string;
  report_count: number;
  percentage: number;
  severity_level: 'CRITICAL' | 'ELEVATED' | 'NORMAL';
}

export interface ResolutionMetrics {
  total_resolved: number;
  avg_resolution_days: number;
  median_resolution_days: number;
}

export interface EngagementMetrics {
  total_claims_awarded: number;
  total_points_distributed: number;
  active_initiatives_count: number;
}

export interface DecisionSupportInsight {
  title: string;
  level: 'CRITICAL' | 'WARNING' | 'POSITIVE' | 'NEUTRAL';
  observation: string;
  recommendation: string;
}

export interface TrendDataPoint {
  date: string;
  submitted_count: number;
  resolved_count: number;
}

export interface DescriptiveAnalytics {
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  resolution_rate_pct: number;
  avg_resolution_days: number;
  median_resolution_days: number;
  total_claims_awarded: number;
  total_points_distributed: number;
  active_initiatives_count: number;
  category_distribution: CategoryBreakdownItem[];
  status_distribution: StatusBreakdownItem[];
  area_hotspots: AreaHotspotItem[];
  daily_operational_trend: TrendDataPoint[];
}

export interface AreaRiskForecastItem {
  area_id: number | null;
  area_name: string;
  historical_count: number;
  predicted_weekly_incidents: number;
  overflow_probability_pct: number;
  risk_level: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK';
  predicted_dominant_category: string;
  proactive_dispatch_action: string;
}

export interface PredictiveAnalytics {
  forecast_horizon_days: number;
  trend_direction: 'UPWARD' | 'DOWNWARD' | 'STABLE';
  projected_weekly_reports: number;
  projected_change_pct: number;
  backlog_clearance_eta_days: number;
  projected_truck_runs_needed: number;
  area_risk_forecasts: AreaRiskForecastItem[];
  model_methodology: string;
}

export interface AnalyticsOverviewResponse {
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  resolution_rate_pct: number;
  category_distribution: CategoryBreakdownItem[];
  status_distribution: StatusBreakdownItem[];
  area_hotspots: AreaHotspotItem[];
  resolution_performance: ResolutionMetrics;
  community_engagement: EngagementMetrics;
  decision_insights: DecisionSupportInsight[];
  procedure_step: string;
  generated_at: string;
  descriptive?: DescriptiveAnalytics;
  predictive?: PredictiveAnalytics;
}
