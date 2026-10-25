'use client';

import { useRealtimeSync } from '@/lib/use-realtime-sync';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  getAllReports,
  getAllClaims,
  getAdvisories,
  getSchedules,
  getHealth,
} from '@/lib/api-client';
import { WasteReport, ReportStatus } from '@/types/reports';
import { ClaimItem } from '@/types/gamification';
import { AdvisoryItem, ScheduleItem } from '@/types/schedules';
import { HealthResponse } from '@/types/api';
import {
  ShieldAlert,
  FileCheck2,
  CalendarDays,
  Award,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Activity,
  ChevronRight,
  Sparkles,
  Server,
  Database,
  Users,
} from 'lucide-react';

const REPORT_STATUS_BADGES: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  SUBMITTED: {
    label: 'Needs Triage',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const loadAdminMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, claimsRes, advisoriesRes, schedulesRes, healthRes] =
        await Promise.allSettled([
          getAllReports(),
          getAllClaims(),
          getAdvisories(),
          getSchedules(),
          getHealth(),
        ]);

      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.items || []);
      if (claimsRes.status === 'fulfilled') setClaims(claimsRes.value || []);
      if (advisoriesRes.status === 'fulfilled') setAdvisories(advisoriesRes.value.items || []);
      if (schedulesRes.status === 'fulfilled') setSchedules(schedulesRes.value.items || []);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminMetrics();
  }, [loadAdminMetrics]);

  // Automatic real-time background synchronization
  useRealtimeSync(loadAdminMetrics, { entity: '*' });

  // Derived counts
  const pendingReports = reports.filter((r) => r.status === 'SUBMITTED');
  const inProgressReports = reports.filter((r) =>
    ['UNDER_REVIEW', 'IN_PROGRESS'].includes(r.status)
  );
  const pendingClaims = claims.filter((c) => c.status === 'PENDING');
  const activeAdvisories = advisories.filter((a) => a.is_active);

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Barangay Sabang Governance
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-mono text-slate-500">
              Role: {user?.role}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-civic-slate tracking-tight">
            Administrative Command Overview
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Real-time status of resident waste complaints, pending clean-up point verifications, active collection routes, and service telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={loadAdminMetrics}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            href="/admin/reports"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover transition-colors shadow-sm"
          >
            <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
            Triage Queue
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Reports (Urgent Triage) */}
        <Link
          href="/admin/reports"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-rose-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Reports
            </span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-civic-slate">
              {pendingReports.length}
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-semibold text-rose-700">
                {pendingReports.length > 0 ? 'Requires Staff Triage' : 'Queue Cleared'}
              </span>
            </div>
          </div>
        </Link>

        {/* Active Investigation / In Progress */}
        <Link
          href="/admin/reports"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-civic-emerald hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Under Investigation
            </span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-civic-slate">
              {inProgressReports.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {reports.length} total operational reports
            </p>
          </div>
        </Link>

        {/* Community Claims Awaiting Verification */}
        <Link
          href="/admin/participation"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unverified Claims
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-civic-slate">
              {pendingClaims.length}
            </div>
            <p className="text-xs text-amber-700 font-medium mt-1">
              {pendingClaims.length > 0 ? 'Awaiting points award' : 'All claims reviewed'}
            </p>
          </div>
        </Link>

        {/* Active Schedule Delays / Advisories */}
        <Link
          href="/admin/schedules"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Advisories
            </span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-civic-slate">
              {activeAdvisories.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {schedules.length} recurring pickup routes active
            </p>
          </div>
        </Link>
      </div>

      {/* Main Operational Split Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Priority Reports Queue Preview */}
        <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-civic-forest" />
              <h2 className="text-sm font-bold text-civic-slate">
                Immediate Review Queue
              </h2>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-civic-forest hover:text-civic-forestHover flex items-center"
            >
              Open Full Queue ({reports.length})
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No waste reports filed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 4).map((report) => {
                const badge =
                  REPORT_STATUS_BADGES[report.status] ||
                  REPORT_STATUS_BADGES.SUBMITTED;
                return (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          REP-{report.id.toString().padStart(4, '0')} • {report.category.replace('_', ' ')}
                        </span>
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {report.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                      <div className="flex items-center space-x-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{report.location_text}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Community Claims Verification Preview */}
        <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-civic-slate">
                SAB-Points Claims to Verify
              </h2>
            </div>
            <Link
              href="/admin/participation"
              className="text-xs font-semibold text-civic-forest hover:text-civic-forestHover flex items-center"
            >
              Verify All ({claims.length})
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No participation claims submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {claims.slice(0, 4).map((claim) => (
                <div
                  key={claim.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      +{claim.points_requested} pts requested
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        claim.status === 'PENDING'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : claim.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {claim.activity_title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                    <span>Resident: {claim.resident_name}</span>
                    <span>{new Date(claim.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System & Infrastructure Telemetry Footer */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-civic-forest">
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">
                Service Diagnostics:
              </span>
              <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{health?.database === 'connected' ? 'PostgreSQL & API Healthy' : 'Degraded'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              SABTRACK Core Engine v{health?.version || '3.0.0'} • Environment: {health?.environment || 'development'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/schedules"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Schedules
          </Link>
          <Link
            href="/admin/announcements"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Announcements
          </Link>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Diagnostics
          </Link>
        </div>
      </div>
    </div>
  );
}
