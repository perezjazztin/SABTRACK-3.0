'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAnalyticsOverview } from '@/lib/api-client';
import { useRealtimeSync } from '@/lib/use-realtime-sync';
import {
  AnalyticsOverviewResponse,
  CategoryBreakdownItem,
  AreaHotspotItem,
  DecisionSupportInsight,
  AreaRiskForecastItem,
  TrendDataPoint,
} from '@/types/analytics';
import { useAuth } from '@/lib/auth-context';
import {
  BarChart3,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Truck,
  Activity,
  Calendar,
  Compass,
} from 'lucide-react';

const SEVERITY_BADGES = {
  CRITICAL: {
    label: 'Critical Hotspot',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  ELEVATED: {
    label: 'Elevated Activity',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  NORMAL: {
    label: 'Normal Flow',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

const RISK_BADGES = {
  HIGH_RISK: {
    label: 'High Overflow Risk',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
    dot: 'bg-rose-600',
  },
  MODERATE_RISK: {
    label: 'Moderate Risk',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  LOW_RISK: {
    label: 'Low Risk',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
};

const INSIGHT_LEVEL_BADGES = {
  CRITICAL: {
    bg: 'bg-rose-50 border-rose-200 text-rose-800',
    iconColor: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-800',
  },
  WARNING: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800',
  },
  POSITIVE: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  NEUTRAL: {
    bg: 'bg-slate-50 border-slate-200 text-slate-800',
    iconColor: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-800',
  },
};

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'BARANGAY_ADMIN';
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'descriptive' | 'predictive'>('all');

  const fetchAnalytics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const res = await getAnalyticsOverview();
      setData(res);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch analytics metrics';
      if (!silent) setError(errorMsg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time synchronization (< 3s SLA)
  useRealtimeSync(() => fetchAnalytics(true), { entity: '*' });

  const predictive = data?.predictive;
  const descriptive = data?.descriptive;

  return (
    <ProtectedRoute
      requiredRole={['BARANGAY_STAFF', 'BARANGAY_ADMIN']}
      moduleName="Executive Business Analytics"
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Staff View-Only Access Banner */}
        {!isAdmin && (
          <div className="flex items-center gap-3 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-blue-900 text-xs shadow-neu-xs">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Staff View-Only Access Mode</p>
              <p className="text-blue-700/90 text-[11px] mt-0.5">
                You are viewing real-time analytical reports, complaint distributions, hotspot severity assessments, and AI-assisted operational insights for Barangay Sabang in read-only mode.
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-semibold border border-blue-200">
              Read-Only
            </span>
          </div>
        )}

        {/* Executive Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/60">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  Descriptive &bull; Predictive Decision Support
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Executive Business Analytics
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Formal 6-Stage Analytical Pipeline &bull; Academic Decision Support for Barangay Sabang
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unified Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('descriptive')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'descriptive'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Descriptive (Historical)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('predictive')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'predictive'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Predictive (Forecast)
              </button>
            </div>

            <button
              onClick={() => fetchAnalytics()}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* 6-Step Multi-Stage Pipeline Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-5 text-white shadow-sm border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/80 pb-3 mb-3 gap-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                IT 313 Course Mandate
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">|</span>
              <span className="text-xs text-slate-200 font-medium">
                Formal 6-Stage Business Analytics Procedure
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RA 10173 Sanitized (0 PII &bull; Numerical Aggregates Only)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 1</p>
              <p className="font-semibold text-slate-200 mt-0.5">Collect</p>
              <p className="text-[10px] text-slate-400">Operational Records</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 2</p>
              <p className="font-semibold text-slate-200 mt-0.5">Sanitize</p>
              <p className="text-[10px] text-slate-400">Strip PII Telemetry</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 3</p>
              <p className="font-semibold text-slate-200 mt-0.5">Descriptive</p>
              <p className="text-[10px] text-slate-400">SQL Group Aggregates</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 4</p>
              <p className="font-semibold text-slate-200 mt-0.5">Pattern Detect</p>
              <p className="text-[10px] text-slate-400">Severity Hotspots</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 5</p>
              <p className="font-semibold text-slate-200 mt-0.5">Predictive</p>
              <p className="text-[10px] text-slate-400">Volume &amp; Risk Outlook</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-500/60">
              <p className="text-[10px] text-emerald-300 font-mono font-bold">STEP 6</p>
              <p className="font-bold text-white mt-0.5">Decision Support</p>
              <p className="text-[10px] text-emerald-200">Proactive Dispatch</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchAnalytics()} className="font-bold underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Primary Descriptive KPI Cards */}
        {(activeTab === 'all' || activeTab === 'descriptive') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Descriptive Analytics (Historical Retrospective)
                </h2>
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                Baseline Cycle: Current Year
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '--' : data?.total_reports ?? 0}
                </div>
                <p className="text-[11px] text-slate-500">Citizen complaints logged</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Open Queue</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-amber-600">
                  {loading ? '--' : data?.open_reports ?? 0}
                </div>
                <p className="text-[11px] text-slate-500">Pending review or active resolution</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Resolution Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-emerald-700">
                  {loading ? '--' : `${data?.resolution_rate_pct ?? 0}%`}
                </div>
                <p className="text-[11px] text-slate-500">
                  {loading ? '--' : `${data?.resolved_reports ?? 0} of ${data?.total_reports ?? 0} cases resolved`}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Awarded SAB-Points</span>
                  <Award className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-3xl font-black text-emerald-800">
                  {loading ? '--' : data?.community_engagement.total_points_distributed.toLocaleString() ?? 0}
                </div>
                <p className="text-[11px] text-slate-500">
                  Across {loading ? '--' : data?.community_engagement.total_claims_awarded ?? 0} verified claims
                </p>
              </div>
            </div>

            {/* Daily Operational Trend (Last 7 Days) */}
            {descriptive?.daily_operational_trend && descriptive.daily_operational_trend.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      7-Day Daily Operational Velocity (Incoming vs Resolved)
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Submitted Complaints
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Resolved Cases
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-2">
                  {descriptive.daily_operational_trend.map((pt) => {
                    const dayLabel = new Date(pt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
                    return (
                      <div key={pt.date} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-mono text-slate-500 block truncate">{dayLabel}</span>
                        <div className="flex items-end justify-center gap-1 h-14 pb-1">
                          <div
                            className="w-3 bg-rose-400 rounded-t transition-all"
                            style={{ height: `${Math.min(100, Math.max(12, pt.submitted_count * 20))}%` }}
                            title={`${pt.submitted_count} submitted`}
                          />
                          <div
                            className="w-3 bg-emerald-600 rounded-t transition-all"
                            style={{ height: `${Math.min(100, Math.max(12, pt.resolved_count * 20))}%` }}
                            title={`${pt.resolved_count} resolved`}
                          />
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">
                          <span className="text-rose-600 font-bold">{pt.submitted_count}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-emerald-700 font-bold">{pt.resolved_count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visual Indicators Grid: Area Hotspots & Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Geographic Hotspot Classification */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Geographic Hotspot Severity Matrix
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 4: Pattern Detection
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Analyzing geographic distributions...</div>
                ) : !data?.area_hotspots || data.area_hotspots.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No area data available.</div>
                ) : (
                  <div className="space-y-2.5">
                    {data.area_hotspots.map((spot, idx) => {
                      const badge = SEVERITY_BADGES[spot.severity_level] || SEVERITY_BADGES.NORMAL;
                      return (
                        <div
                          key={spot.area_id ?? idx}
                          className="p-3.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                              <h4 className="text-xs font-bold text-slate-800">{spot.area_name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {spot.report_count} complaints logged &bull; {spot.percentage}% of barangay total
                            </p>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Report Category Distribution
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 5: Visual Indicators
                  </span>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Aggregating report categories...</div>
                ) : !data?.category_distribution || data.category_distribution.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No report categories recorded.</div>
                ) : (
                  <div className="space-y-3">
                    {data.category_distribution.map((cat) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">
                            {cat.category.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {cat.count} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Predictive Analytics & Forecasting Section */}
        {(activeTab === 'all' || activeTab === 'predictive') && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Predictive Analytics &amp; Operational Forecasts
                </h2>
              </div>
              <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Horizon: Next 7-Day Cycle &bull; Linear Regression Model
              </span>
            </div>

            {/* Predictive Forecast KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 rounded-2xl border border-blue-200/80 p-5 sm:p-6 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Projected Influx</span>
                  {predictive?.trend_direction === 'UPWARD' ? (
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                  ) : predictive?.trend_direction === 'DOWNWARD' ? (
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '--' : predictive?.projected_weekly_reports ?? 0}
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className={`font-bold ${
                    predictive?.trend_direction === 'UPWARD'
                      ? 'text-rose-600'
                      : predictive?.trend_direction === 'DOWNWARD'
                      ? 'text-emerald-700'
                      : 'text-slate-600'
                  }`}>
                    {predictive?.trend_direction} ({predictive?.projected_change_pct ? `${predictive.projected_change_pct > 0 ? '+' : ''}${predictive.projected_change_pct}%` : '0%'})
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-500">vs past week</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Required Truck Runs</span>
                  <Truck className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '--' : predictive?.projected_truck_runs_needed ?? 1}
                </div>
                <p className="text-[11px] text-slate-500">Recommended dispatches to prevent overflow</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Backlog Clearance ETA</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '--' : `${predictive?.backlog_clearance_eta_days ?? 0}d`}
                </div>
                <p className="text-[11px] text-slate-500">Based on historical staff resolution velocity</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Highest Risk Zone</span>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-lg font-bold text-slate-900 truncate">
                  {loading
                    ? '--'
                    : predictive?.area_risk_forecasts?.[0]?.area_name || 'Normal Distribution'}
                </div>
                <p className="text-[11px] text-slate-500">
                  {predictive?.area_risk_forecasts?.[0]?.overflow_probability_pct ?? 0}% overflow probability
                </p>
              </div>
            </div>

            {/* Purok / Sector Risk & Overflow Forecasting Matrix */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Purok Risk Level &amp; Overflow Probability Forecasting Matrix
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calculated via Bayesian Laplace Prior based on recurring violation frequency and route timing
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
                  7-Day Forward Horizon
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">Purok / Sector</th>
                      <th className="px-4 py-3.5 text-center">Historical</th>
                      <th className="px-4 py-3.5 text-center">Predicted (7d)</th>
                      <th className="px-5 py-3.5">Overflow Probability</th>
                      <th className="px-4 py-3.5">Risk Level</th>
                      <th className="px-5 py-3.5">Proactive Action Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {!predictive?.area_risk_forecasts || predictive.area_risk_forecasts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-6 text-center text-slate-400 text-xs">
                          No area risk telemetry recorded yet.
                        </td>
                      </tr>
                    ) : (
                      predictive.area_risk_forecasts.map((forecast, i) => {
                        const badge = RISK_BADGES[forecast.risk_level] || RISK_BADGES.LOW_RISK;
                        return (
                          <tr key={forecast.area_id ?? i} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-slate-900">
                              {forecast.area_name}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono text-slate-600">
                              {forecast.historical_count}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                              {forecast.predicted_weekly_incidents}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full ${
                                      forecast.risk_level === 'HIGH_RISK'
                                        ? 'bg-rose-500'
                                        : forecast.risk_level === 'MODERATE_RISK'
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${forecast.overflow_probability_pct}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-bold text-slate-700">
                                  {forecast.overflow_probability_pct}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[11px] text-slate-600 leading-relaxed max-w-sm">
                              {forecast.proactive_dispatch_action}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Decision Support & Synthesized Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Step 6: Synthesized Administrative Decision Support
              </h2>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Algorithmic Pattern &amp; Trend-Driven</span>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Synthesizing recommendations...</div>
          ) : !data?.decision_insights || data.decision_insights.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No operational alerts generated.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.decision_insights.map((insight, idx) => {
                const badge = INSIGHT_LEVEL_BADGES[insight.level] || INSIGHT_LEVEL_BADGES.NEUTRAL;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${badge.bg} space-y-2.5 transition-all`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {insight.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.badge}`}>
                        {insight.level}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Observation: </strong>
                      {insight.observation}
                    </p>

                    <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 text-xs text-slate-700 space-y-0.5">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-800">
                        Recommended Action:
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-800">
                        {insight.recommendation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1">
            <span>
              Generated at {data?.generated_at ? new Date(data.generated_at).toLocaleString() : '--'}
            </span>
            <span className="font-medium text-slate-600">
              Conforms with Section 9 &bull; RA 10173 Academic Guardrail (Zero Resident PII)
            </span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
