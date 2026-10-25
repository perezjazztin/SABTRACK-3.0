'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { getAnalyticsOverview } from '@/lib/api-client';
import {
  AnalyticsOverviewResponse,
  CategoryBreakdownItem,
  AreaHotspotItem,
  DecisionSupportInsight,
} from '@/types/analytics';
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Award,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
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
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalyticsOverview();
      setData(res);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch analytics metrics';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <ProtectedRoute
      requiredRole="BARANGAY_ADMIN"
      moduleName="Executive Business Analytics"
    >
      <div className="space-y-6">
        {/* Executive Header */}
        <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 text-civic-forest rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-civic-slate tracking-tight">
                Executive Business Analytics
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Formal 6-Stage Analytical Pipeline &bull; Academic Decision Support for Barangay Sabang
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Analytics
            </button>
          </div>
        </div>

        {/* 6-Step Multi-Stage Pipeline Banner */}
        <div className="bg-gradient-to-r from-civic-slate to-slate-900 rounded-2xl p-5 text-white shadow-sm border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                IT 313 Course Mandate
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-200 font-medium">
                Formal 6-Stage Business Analytics Procedure
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RA 10173 Sanitized (0 PII)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 1</p>
              <p className="font-semibold text-slate-200 mt-0.5">Collect</p>
              <p className="text-[10px] text-slate-400">Operational Records</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 2</p>
              <p className="font-semibold text-slate-200 mt-0.5">Sanitize</p>
              <p className="text-[10px] text-slate-400">Strip PII Telemetry</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 3</p>
              <p className="font-semibold text-slate-200 mt-0.5">Aggregate</p>
              <p className="text-[10px] text-slate-400">SQL Group Aggregates</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 4</p>
              <p className="font-semibold text-slate-200 mt-0.5">Detect</p>
              <p className="text-[10px] text-slate-400">Pattern &amp; Hotspots</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-mono">STEP 5</p>
              <p className="font-semibold text-slate-200 mt-0.5">Visualize</p>
              <p className="text-[10px] text-slate-400">Visual Indicators</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-900/40 border border-emerald-500/50">
              <p className="text-[10px] text-emerald-300 font-mono font-bold">STEP 6</p>
              <p className="font-bold text-white mt-0.5">Support</p>
              <p className="text-[10px] text-emerald-200">Decision Insights</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchAnalytics} className="font-bold underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Primary KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-civic-slate">
              {loading ? '--' : data?.total_reports ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Total citizen complaints logged</p>
          </div>

          <div className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Open Queue</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {loading ? '--' : data?.open_reports ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Pending triage or in-progress field work</p>
          </div>

          <div className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Resolution Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {loading ? '--' : `${data?.resolution_rate_pct ?? 0}%`}
            </div>
            <p className="text-[11px] text-slate-400">
              {loading ? '--' : `${data?.resolved_reports ?? 0} of ${data?.total_reports ?? 0} cases resolved`}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Awarded SAB-Points</span>
              <Award className="w-4 h-4 text-civic-forest" />
            </div>
            <div className="text-2xl font-black text-civic-forest">
              {loading ? '--' : data?.community_engagement.total_points_distributed.toLocaleString() ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">
              Across {loading ? '--' : data?.community_engagement.total_claims_awarded ?? 0} verified claims
            </p>
          </div>
        </div>

        {/* Visual Indicators Grid: Area Hotspots & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Hotspot Classification (Step 4 & 5) */}
          <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-civic-forest" />
                <h2 className="text-sm font-bold text-civic-slate">
                  Geographic Hotspot Severity Matrix
                </h2>
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
              <div className="space-y-3">
                {data.area_hotspots.map((spot, idx) => {
                  const badge = SEVERITY_BADGES[spot.severity_level] || SEVERITY_BADGES.NORMAL;
                  return (
                    <div
                      key={spot.area_id ?? idx}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <h3 className="text-xs font-bold text-slate-800">{spot.area_name}</h3>
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

          {/* Category Distribution (Step 5) */}
          <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-civic-forest" />
                <h2 className="text-sm font-bold text-civic-slate">
                  Report Category Distribution
                </h2>
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
              <div className="space-y-3.5">
                {data.category_distribution.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
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
                        className="bg-civic-forest h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Step 6: Decision Support & Actionable Recommendations */}
        <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-civic-forest" />
              <h2 className="text-sm font-bold text-civic-slate">
                Step 6: Synthesized Administrative Decision Support
              </h2>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5" />
              <span>Algorithmic Pattern-Driven</span>
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

                    <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/60 text-xs text-slate-700 space-y-0.5">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-civic-forest">
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

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Generated at {data?.generated_at ? new Date(data.generated_at).toLocaleString() : '--'}
            </span>
            <span className="font-medium text-slate-600">
              Conforms with Section 9 &bull; RA 10173 Academic Guardrail
            </span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
