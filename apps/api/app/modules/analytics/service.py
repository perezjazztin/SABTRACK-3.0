import math
import statistics
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.modules.reports.models import Report, ReportStatus, ReportCategory
from app.modules.areas.models import Area
from app.modules.gamification.models import ParticipationClaim, ClaimStatus, PointsLedger, Initiative
from app.modules.analytics.schemas import (
    CategoryBreakdownItem,
    StatusBreakdownItem,
    AreaHotspotItem,
    ResolutionMetrics,
    EngagementMetrics,
    DecisionSupportInsight,
    TrendDataPoint,
    DescriptiveAnalytics,
    AreaRiskForecastItem,
    PredictiveAnalytics,
    AnalyticsOverviewResponse,
)


class AnalyticsService:
    """Formal Business Analytics Engine implementing the mandated 6-step analytics procedure
    with rigorous Descriptive (Historical Aggregates) and Predictive (Operational Forecasting) results.

    Pipeline:
      1. Collect: Query database operational records
      2. Sanitize: Strip all PII; strictly work with numerical and categorical aggregates (RA 10173)
      3. Aggregate: SQL group-by counts, durations, and financial/points distribution
      4. Pattern Detection: Classify area hotspots by severity, detect report backlogs
      5. Visual Indicators: Generate clean distribution objects for charts and dashboards
      6. Decision Support: Synthesize policy and operational recommendations for Barangay Officials
    """

    @classmethod
    def get_overview_analytics(cls, db: Session) -> AnalyticsOverviewResponse:
        now = datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # STEP 1 & 2: Collect & Sanitize (Pure numerical/categorical extraction)
        # -------------------------------------------------------------
        reports = db.query(Report).all()
        total_reports = len(reports)

        # -------------------------------------------------------------
        # STEP 3: SQL Aggregation (Descriptive Foundations)
        # -------------------------------------------------------------
        # Status distribution
        status_counts: Dict[str, int] = {}
        for r in reports:
            st = r.status.value if hasattr(r.status, "value") else str(r.status)
            status_counts[st] = status_counts.get(st, 0) + 1

        status_distribution = [
            StatusBreakdownItem(status=st, count=cnt)
            for st, cnt in sorted(status_counts.items(), key=lambda x: x[0])
        ]

        resolved_count = status_counts.get(ReportStatus.RESOLVED.value, 0)
        open_count = (
            status_counts.get(ReportStatus.SUBMITTED.value, 0)
            + status_counts.get(ReportStatus.UNDER_REVIEW.value, 0)
            + status_counts.get(ReportStatus.IN_PROGRESS.value, 0)
        )
        resolution_rate = round((resolved_count / total_reports * 100.0), 1) if total_reports > 0 else 0.0

        # Category distribution
        category_counts: Dict[str, int] = {}
        for r in reports:
            cat = r.category.value if hasattr(r.category, "value") else str(r.category)
            category_counts[cat] = category_counts.get(cat, 0) + 1

        category_distribution = [
            CategoryBreakdownItem(
                category=cat,
                count=cnt,
                percentage=round((cnt / total_reports * 100.0), 1) if total_reports > 0 else 0.0,
            )
            for cat, cnt in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        # Area distribution & Hotspots
        areas = db.query(Area).all()
        area_map = {a.id: a.name for a in areas}
        area_counts: Dict[Optional[int], int] = {}
        area_categories: Dict[Optional[int], Dict[str, int]] = {}

        for r in reports:
            area_counts[r.area_id] = area_counts.get(r.area_id, 0) + 1
            cat_str = r.category.value if hasattr(r.category, "value") else str(r.category)
            if r.area_id not in area_categories:
                area_categories[r.area_id] = {}
            area_categories[r.area_id][cat_str] = area_categories[r.area_id].get(cat_str, 0) + 1

        area_hotspots: List[AreaHotspotItem] = []
        for a_id, cnt in sorted(area_counts.items(), key=lambda x: x[1], reverse=True):
            area_name = area_map.get(a_id, "Unspecified Purok" if a_id is None else f"Area #{a_id}")
            pct = round((cnt / total_reports * 100.0), 1) if total_reports > 0 else 0.0

            # ---------------------------------------------------------
            # STEP 4: Pattern Detection (Hotspot Severity Grading)
            # ---------------------------------------------------------
            if pct >= 35.0 or cnt >= 5:
                severity = "CRITICAL"
            elif pct >= 15.0 or cnt >= 2:
                severity = "ELEVATED"
            else:
                severity = "NORMAL"

            area_hotspots.append(
                AreaHotspotItem(
                    area_id=a_id,
                    area_name=area_name,
                    report_count=cnt,
                    percentage=pct,
                    severity_level=severity,
                )
            )

        # Resolution time duration (days)
        resolution_durations: List[float] = []
        resolved_reports = [r for r in reports if r.status in (ReportStatus.RESOLVED, "RESOLVED")]
        for r in resolved_reports:
            resolved_history = [
                h for h in getattr(r, "status_history", [])
                if h.new_status in (ReportStatus.RESOLVED.value, ReportStatus.RESOLVED, "RESOLVED")
            ]
            if resolved_history:
                resolved_time = resolved_history[0].created_at
                duration_days = max(0.0, (resolved_time - r.created_at).total_seconds() / 86400.0)
                resolution_durations.append(duration_days)
            else:
                duration_days = max(0.0, (r.updated_at - r.created_at).total_seconds() / 86400.0)
                resolution_durations.append(duration_days)

        avg_res_days = round(statistics.mean(resolution_durations), 2) if resolution_durations else 0.0
        median_res_days = round(statistics.median(resolution_durations), 2) if resolution_durations else 0.0

        resolution_performance = ResolutionMetrics(
            total_resolved=resolved_count,
            avg_resolution_days=avg_res_days,
            median_resolution_days=median_res_days,
        )

        # Engagement Metrics
        total_claims_awarded = db.query(ParticipationClaim).filter(
            ParticipationClaim.status == ClaimStatus.APPROVED
        ).count()

        points_sum = db.query(func.coalesce(func.sum(PointsLedger.points), 0)).scalar() or 0
        active_initiatives = db.query(Initiative).filter(Initiative.is_active == True).count()

        community_engagement = EngagementMetrics(
            total_claims_awarded=total_claims_awarded,
            total_points_distributed=int(points_sum),
            active_initiatives_count=active_initiatives,
        )

        # -------------------------------------------------------------
        # STEP 5: Daily Operational Trend (Last 7 Days Time-Series)
        # -------------------------------------------------------------
        now_date = now.date()
        daily_submitted: Dict[str, int] = {}
        daily_resolved: Dict[str, int] = {}
        for i in range(6, -1, -1):
            d_str = (now_date - timedelta(days=i)).isoformat()
            daily_submitted[d_str] = 0
            daily_resolved[d_str] = 0

        for r in reports:
            r_cdate = r.created_at.date().isoformat() if hasattr(r.created_at, "date") else str(r.created_at)[:10]
            if r_cdate in daily_submitted:
                daily_submitted[r_cdate] += 1
            if r.status in (ReportStatus.RESOLVED, "RESOLVED"):
                r_rdate = r.updated_at.date().isoformat() if hasattr(r.updated_at, "date") else str(r.updated_at)[:10]
                if r_rdate in daily_resolved:
                    daily_resolved[r_rdate] += 1

        daily_operational_trend = [
            TrendDataPoint(
                date=d,
                submitted_count=daily_submitted[d],
                resolved_count=daily_resolved[d],
            )
            for d in sorted(daily_submitted.keys())
        ]

        descriptive = DescriptiveAnalytics(
            total_reports=total_reports,
            open_reports=open_count,
            resolved_reports=resolved_count,
            resolution_rate_pct=resolution_rate,
            avg_resolution_days=avg_res_days,
            median_resolution_days=median_res_days,
            total_claims_awarded=total_claims_awarded,
            total_points_distributed=int(points_sum),
            active_initiatives_count=active_initiatives,
            category_distribution=category_distribution,
            status_distribution=status_distribution,
            area_hotspots=area_hotspots,
            daily_operational_trend=daily_operational_trend,
        )

        # -------------------------------------------------------------
        # PREDICTIVE ANALYTICS ENGINE: Linear Regression & Bayesian Risk
        # -------------------------------------------------------------
        # 1. Volume & Trend Regression across 7-day window
        y_values = [daily_submitted[d] for d in sorted(daily_submitted.keys())]
        x_values = list(range(len(y_values)))
        n_points = len(x_values)

        if n_points > 1:
            mean_x = statistics.mean(x_values)
            mean_y = statistics.mean(y_values)
            denom = sum((x - mean_x) ** 2 for x in x_values)
            numer = sum((x_values[i] - mean_x) * (y_values[i] - mean_y) for i in range(n_points))
            slope = (numer / denom) if denom != 0 else 0.0
        else:
            slope = 0.0

        if slope > 0.15:
            trend_direction = "UPWARD"
        elif slope < -0.15:
            trend_direction = "DOWNWARD"
        else:
            trend_direction = "STABLE"

        recent_7day_total = sum(y_values)
        if recent_7day_total > 0:
            avg_daily = recent_7day_total / 7.0
            # Project next 7 days incorporating slope momentum
            projected_weekly = round(max(1.0, (avg_daily + (slope * 3.5)) * 7.0), 1)
            projected_change_pct = round(((projected_weekly - recent_7day_total) / recent_7day_total) * 100.0, 1)
        elif total_reports > 0:
            projected_weekly = round(max(1.0, (total_reports / 14.0) * 7.0), 1)
            projected_change_pct = 0.0
        else:
            projected_weekly = 0.0
            projected_change_pct = 0.0

        # Backlog clearance ETA
        recent_7day_resolved = sum(daily_resolved.values())
        if recent_7day_resolved > 0:
            daily_res_rate = recent_7day_resolved / 7.0
            backlog_clearance_eta = round(open_count / max(0.1, daily_res_rate), 1)
        elif open_count == 0:
            backlog_clearance_eta = 0.0
        else:
            fallback_res_rate = max(0.2, (resolved_count / 14.0 if resolved_count > 0 else 0.2))
            backlog_clearance_eta = round(open_count / fallback_res_rate, 1)

        # Projected truck runs needed (5 complaints capacity per run)
        projected_truck_runs = max(1, math.ceil(projected_weekly / 5.0)) if projected_weekly > 0 else 1

        # 2. Area Risk & Overflow Probability Forecasts
        area_risk_forecasts: List[AreaRiskForecastItem] = []
        num_areas = max(1, len(areas))

        # Include all known areas + any unspecified
        all_area_keys = list(area_map.keys())
        if None in area_counts and None not in all_area_keys:
            all_area_keys.append(None)
        if not all_area_keys:
            all_area_keys = [None]

        for a_id in all_area_keys:
            cnt = area_counts.get(a_id, 0)
            area_name = area_map.get(a_id, "Barangay Sabang (General Sector)" if a_id is None else f"Area #{a_id}")

            # Bayesian Laplace-smoothed probability of waste overflow / violation in next cycle
            if total_reports > 0:
                prob = min(95.0, max(5.0, round(((cnt + 1.0) / (total_reports + num_areas * 1.5)) * 100.0 * 2.2, 1)))
                pred_incidents = round(max(0.1, (cnt / max(1, total_reports)) * projected_weekly), 1)
            else:
                prob = 10.0
                pred_incidents = 0.0

            # Determine dominant category in this specific area
            cats_in_area = area_categories.get(a_id, {})
            if cats_in_area:
                dominant_cat = sorted(cats_in_area.items(), key=lambda x: x[1], reverse=True)[0][0]
            else:
                dominant_cat = "UNCOLLECTED_GARBAGE"

            if prob >= 50.0 or cnt >= 4:
                risk_lvl = "HIGH_RISK"
                action = "Pre-deploy secondary waste collection vehicle and schedule daily eco-patrol inspection."
            elif prob >= 25.0 or cnt >= 2:
                risk_lvl = "MODERATE_RISK"
                action = "Adjust mid-week collection timetable and inspect local commercial waste generators."
            else:
                risk_lvl = "LOW_RISK"
                action = "Maintain standard scheduled collection frequency with routine monitoring."

            area_risk_forecasts.append(
                AreaRiskForecastItem(
                    area_id=a_id,
                    area_name=area_name,
                    historical_count=cnt,
                    predicted_weekly_incidents=pred_incidents,
                    overflow_probability_pct=prob,
                    risk_level=risk_lvl,
                    predicted_dominant_category=dominant_cat,
                    proactive_dispatch_action=action,
                )
            )

        # Sort area forecasts by risk probability descending
        area_risk_forecasts.sort(key=lambda x: x.overflow_probability_pct, reverse=True)

        predictive = PredictiveAnalytics(
            forecast_horizon_days=7,
            trend_direction=trend_direction,
            projected_weekly_reports=projected_weekly,
            projected_change_pct=projected_change_pct,
            backlog_clearance_eta_days=backlog_clearance_eta,
            projected_truck_runs_needed=projected_truck_runs,
            area_risk_forecasts=area_risk_forecasts,
            model_methodology="Linear Trend Regression with 7-Day Moving Window & Bayesian Prior",
        )

        # -------------------------------------------------------------
        # STEP 6: Visual Indicators & Synthesized Decision Support
        # -------------------------------------------------------------
        decision_insights: List[DecisionSupportInsight] = []

        # 1. Predictive Trend & Volume Insight
        if trend_direction == "UPWARD" and projected_change_pct > 10.0:
            decision_insights.append(
                DecisionSupportInsight(
                    title=f"Predictive Outlook: +{projected_change_pct}% Upward Volume Trend",
                    level="CRITICAL",
                    observation=f"Statistical linear regression forecasts {projected_weekly} incoming complaints in the next 7 days (vs {recent_7day_total} past week).",
                    recommendation=f"Prepare {projected_truck_runs} waste truck collection runs next week and pre-assign personnel to high-risk zones.",
                )
            )
        elif trend_direction == "DOWNWARD":
            decision_insights.append(
                DecisionSupportInsight(
                    title=f"Predictive Outlook: {projected_change_pct}% Reduction Trend",
                    level="POSITIVE",
                    observation=f"Recent collection enforcement has decreased incoming complaint velocity. Projected incoming load: {projected_weekly} reports.",
                    recommendation="Maintain current route timings and focus personnel on unresolved backlog tickets.",
                )
            )

        # 2. Check for Hotspots
        critical_hotspots = [h for h in area_hotspots if h.severity_level == "CRITICAL"]
        elevated_hotspots = [h for h in area_hotspots if h.severity_level == "ELEVATED"]

        if critical_hotspots:
            top_spot = critical_hotspots[0]
            decision_insights.append(
                DecisionSupportInsight(
                    title=f"Critical Waste Hotspot: {top_spot.area_name}",
                    level="CRITICAL",
                    observation=f"{top_spot.area_name} accounts for {top_spot.percentage}% of all community reports ({top_spot.report_count} complaints).",
                    recommendation="Deploy an immediate supplementary waste collection truck and inspect for unpermitted roadside dumping.",
                )
            )
        elif elevated_hotspots:
            top_elev = elevated_hotspots[0]
            decision_insights.append(
                DecisionSupportInsight(
                    title=f"Elevated Complaint Concentration: {top_elev.area_name}",
                    level="WARNING",
                    observation=f"{top_elev.area_name} generates {top_elev.percentage}% of reports ({top_elev.report_count} items).",
                    recommendation="Review the scheduled pickup timetable for this purok with the contractor or barangay eco-patrol.",
                )
            )

        # 3. Check Dominant Waste Category
        if category_distribution:
            top_cat = category_distribution[0]
            if top_cat.percentage >= 40.0:
                cat_readable = top_cat.category.replace("_", " ").title()
                decision_insights.append(
                    DecisionSupportInsight(
                        title=f"Dominant Complaint Category: {cat_readable}",
                        level="WARNING",
                        observation=f"{cat_readable} represents {top_cat.percentage}% of all citizen reports ({top_cat.count} reports).",
                        recommendation="Post targeted advisory bulletins and increase monitoring along primary collection routes.",
                    )
                )

        # 4. Check Open Queue Backlog
        if open_count >= 5:
            decision_insights.append(
                DecisionSupportInsight(
                    title="Active Operational Triage Backlog",
                    level="WARNING",
                    observation=f"There are currently {open_count} open reports awaiting field resolution (Estimated clearance time: {backlog_clearance_eta} days).",
                    recommendation="Assign administrative staff to review submitted reports and coordinate dispatch with barangay cleaners.",
                )
            )
        elif total_reports > 0 and resolution_rate >= 75.0:
            decision_insights.append(
                DecisionSupportInsight(
                    title="High Operational Resolution Efficiency",
                    level="POSITIVE",
                    observation=f"Barangay resolution rate is currently at {resolution_rate}%, with {resolved_count} resolved cases.",
                    recommendation="Maintain current staff response SLAs and prioritize remaining open triage items.",
                )
            )

        # 5. Check Gamification Engagement
        if total_claims_awarded >= 1:
            decision_insights.append(
                DecisionSupportInsight(
                    title="Civic Segregation & Engagement Impact",
                    level="POSITIVE",
                    observation=f"{total_claims_awarded} verified participation claims have awarded {int(points_sum)} SAB-Points across {active_initiatives} active initiatives.",
                    recommendation="Expand community clean-up initiatives into identified elevated hotspot areas.",
                )
            )
        else:
            decision_insights.append(
                DecisionSupportInsight(
                    title="Community Participation Onboarding",
                    level="NEUTRAL",
                    observation="No resident participation claims have been verified yet in the current cycle.",
                    recommendation="Broadcast official announcements encouraging residents to participate in upcoming barangay clean-ups.",
                )
            )

        return AnalyticsOverviewResponse(
            total_reports=total_reports,
            open_reports=open_count,
            resolved_reports=resolved_count,
            resolution_rate_pct=resolution_rate,
            category_distribution=category_distribution,
            status_distribution=status_distribution,
            area_hotspots=area_hotspots,
            resolution_performance=resolution_performance,
            community_engagement=community_engagement,
            decision_insights=decision_insights,
            procedure_step="Step 6: Visual Indicators & Decision Support",
            generated_at=now,
            descriptive=descriptive,
            predictive=predictive,
        )
