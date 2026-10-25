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
}
