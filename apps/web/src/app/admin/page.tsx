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
    <div className="space-y-8">
      {/* Executive Command Header */}
      <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
              Barangay Sabang Governance
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Role: {user?.role}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-civic-slate tracking-tight">
            Administrative Command Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Real-time status of resident waste complaints, pending clean-up point verifications, active collection routes, and service telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={loadAdminMetrics}
            disabled={loading}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/70 hover:bg-white text-slate-700 transition-all border border-slate-200 shadow-neu-xs active:shadow-neu-green-pressed"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            href="/admin/reports"
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-civic-forest text-white hover:bg-civic-forestHover transition-colors shadow-neu-green"
          >
            <FileCheck2 className="w-4 h-4 mr-1.5" />
            Triage Queue
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* Pending Reports (Urgent Triage) */}
        <Link
          href="/admin/reports"
          className="neu-card p-6 rounded-3xl border border-emerald-900/10 shadow-neu-raised hover:shadow-neu-raised-hover transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Reports
            </span>
            <div className="neu-socket p-3 rounded-2xl text-rose-600 group-hover:scale-105 transition-transform flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-civic-slate">
              {pendingReports.length}
            </div>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-rose-700">
                {pendingReports.length > 0 ? 'Requires Staff Triage' : 'Queue Cleared'}
              </span>
            </div>
          </div>
        </Link>

        {/* Active Investigation / In Progress */}
        <Link
          href="/admin/reports"
          className="neu-card p-6 rounded-3xl border border-emerald-900/10 shadow-neu-raised hover:shadow-neu-raised-hover transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Under Investigation
            </span>
            <div className="neu-socket p-3 rounded-2xl text-blue-600 group-hover:scale-105 transition-transform flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-civic-slate">
              {inProgressReports.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {reports.length} total operational reports
            </p>
          </div>
        </Link>

        {/* Community Claims Awaiting Verification */}
        <Link
          href="/admin/participation"
          className="neu-card p-6 rounded-3xl border border-emerald-900/10 shadow-neu-raised hover:shadow-neu-raised-hover transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Unverified Claims
            </span>
            <div className="neu-socket p-3 rounded-2xl text-amber-600 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-civic-slate">
              {pendingClaims.length}
            </div>
            <p className="text-xs text-amber-700 font-bold mt-1.5">
              {pendingClaims.length > 0 ? 'Awaiting points award' : 'All claims reviewed'}
            </p>
          </div>
        </Link>

        {/* Active Schedule Delays / Advisories */}
        <Link
          href="/admin/schedules"
          className="neu-card p-6 rounded-3xl border border-emerald-900/10 shadow-neu-raised hover:shadow-neu-raised-hover transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Advisories
            </span>
            <div className="neu-socket p-3 rounded-2xl text-purple-600 group-hover:scale-105 transition-transform flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-civic-slate">
              {activeAdvisories.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {schedules.length} recurring pickup routes active
            </p>
          </div>
        </Link>
      </div>

      {/* Main Operational Split Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Priority Reports Queue Preview */}
        <div className="neu-card rounded-3xl border border-emerald-900/10 p-6 sm:p-7 shadow-neu-raised space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-civic-forest">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-civic-slate">
                Immediate Review Queue
              </h2>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-civic-forest hover:text-civic-forestHover flex items-center"
            >
              Open Full Queue ({reports.length})
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No waste reports filed yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {reports.slice(0, 4).map((report) => {
                const badge =
                  REPORT_STATUS_BADGES[report.status] ||
                  REPORT_STATUS_BADGES.SUBMITTED;
                return (
                  <div
                    key={report.id}
                    className="p-4 rounded-2xl border border-emerald-900/5 bg-white shadow-neu-xs hover:shadow-neu-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          REP-{report.id.toString().padStart(4, '0')} &bull; {report.category.replace('_', ' ')}
                        </span>
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {report.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 truncate max-w-[220px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{report.location_text}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
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
        <div className="neu-card rounded-3xl border border-emerald-900/10 p-6 sm:p-7 shadow-neu-raised space-y-5">
          <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-sm font-bold text-civic-slate">
                SAB-Points Claims to Verify
              </h2>
            </div>
            <Link
              href="/admin/participation"
              className="text-xs font-bold text-civic-forest hover:text-civic-forestHover flex items-center"
            >
              Verify All ({claims.length})
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No participation claims submitted yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {claims.slice(0, 4).map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl border border-emerald-900/5 bg-white shadow-neu-xs hover:shadow-neu-sm transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      +{claim.points_requested} pts requested
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
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
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-medium">Resident: {claim.resident_name}</span>
                    <span>{new Date(claim.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System & Infrastructure Telemetry Footer */}
      <div className="neu-card rounded-2xl border border-emerald-900/10 p-5 shadow-neu-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-civic-forest flex-shrink-0 shadow-neu-xs">
            <Activity className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">
                Service Diagnostics:
              </span>
              <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{health?.database === 'connected' ? 'PostgreSQL & API Healthy' : 'Degraded'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              SABTRACK Core Engine v{health?.version || '3.0.0'} &bull; Environment: {health?.environment || 'development'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/admin/schedules"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-neu-xs transition-colors"
          >
            Schedules
          </Link>
          <Link
            href="/admin/announcements"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-neu-xs transition-colors"
          >
            Announcements
          </Link>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-neu-xs transition-colors"
          >
            Diagnostics
          </Link>
        </div>
      </div>
    </div>
  );
}
