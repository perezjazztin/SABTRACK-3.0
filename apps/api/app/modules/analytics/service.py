import statistics
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.modules.identity.models import User
from app.modules.reports.models import Report, ReportStatus, ReportCategory, ReportStatusHistory
from app.modules.areas.models import Area
from app.modules.gamification.models import ParticipationClaim, ClaimStatus, PointsLedger, Initiative
from app.modules.analytics.schemas import (
    CategoryBreakdownItem,
    StatusBreakdownItem,
    AreaHotspotItem,
    ResolutionMetrics,
    EngagementMetrics,
    DecisionSupportInsight,
    AnalyticsOverviewResponse,
)


class AnalyticsService:
    """Formal Business Analytics Engine implementing the mandated 6-step analytics procedure.
    
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
        # STEP 3: SQL Aggregation
        # -------------------------------------------------------------
        # Status distribution
        status_counts: dict[str, int] = {}
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
        category_counts: dict[str, int] = {}
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
        area_counts: dict[Optional[int], int] = {}
        for r in reports:
            area_counts[r.area_id] = area_counts.get(r.area_id, 0) + 1

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
        resolved_reports = [r for r in reports if r.status == ReportStatus.RESOLVED]
        for r in resolved_reports:
            # Look for resolved status history entry
            resolved_history = [
                h for h in r.status_history if h.new_status in (ReportStatus.RESOLVED.value, ReportStatus.RESOLVED, "RESOLVED")
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
        # STEP 5 & 6: Visual Indicators & Decision Support Synthesis
        # -------------------------------------------------------------
        decision_insights: List[DecisionSupportInsight] = []

        # 1. Check for Hotspots
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

        # 2. Check Dominant Waste Category
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

        # 3. Check Open Queue Backlog
        if open_count >= 5:
            decision_insights.append(
                DecisionSupportInsight(
                    title="Active Operational Triage Backlog",
                    level="WARNING",
                    observation=f"There are currently {open_count} open reports awaiting field resolution or verification.",
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

        # 4. Check Gamification Engagement
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
        )
