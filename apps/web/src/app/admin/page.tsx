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
} from '@/lib/api-client';
import { WasteReport, ReportStatus } from '@/types/reports';
import { ClaimItem } from '@/types/gamification';
import { AdvisoryItem, ScheduleItem } from '@/types/schedules';
import {
  FileCheck2,
  CalendarDays,
  Award,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  ChevronRight,
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

  const loadAdminMetrics = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [reportsRes, claimsRes, advisoriesRes, schedulesRes] =
        await Promise.allSettled([
          getAllReports(),
          getAllClaims(),
          getAdvisories(),
          getSchedules(),
        ]);

      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.items || []);
      if (claimsRes.status === 'fulfilled') setClaims(claimsRes.value || []);
      if (advisoriesRes.status === 'fulfilled') setAdvisories(advisoriesRes.value.items || []);
      if (schedulesRes.status === 'fulfilled') setSchedules(schedulesRes.value.items || []);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminMetrics();
  }, [loadAdminMetrics]);

  // Automatic background synchronization (< 3s SLA)
  useRealtimeSync(() => loadAdminMetrics(true), { entity: '*' });

  // Derived counts
  const pendingReports = reports.filter((r) => r.status === 'SUBMITTED');
  const inProgressReports = reports.filter((r) =>
    ['UNDER_REVIEW', 'IN_PROGRESS'].includes(r.status)
  );
  const pendingClaims = claims.filter((c) => c.status === 'PENDING');
  const activeAdvisories = advisories.filter((a) => a.is_active);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Executive Command Header */}
      <div className="neu-card rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              {user?.role === 'BARANGAY_STAFF' ? 'Barangay Sabang Staff Portal' : 'Barangay Sabang Governance'}
            </span>
            <span className="text-xs text-slate-300">&bull;</span>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Role: {user?.role}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {user?.role === 'BARANGAY_STAFF' ? 'Staff Console Overview' : 'Administrative Command Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Status of resident waste complaints, pending clean-up point verifications, active collection routes, and service telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={() => loadAdminMetrics()}
            disabled={loading}
            className="neu-btn-secondary inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            href="/admin/reports"
            className="neu-btn-primary inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-neu-green"
          >
            <FileCheck2 className="w-4 h-4 mr-1.5" />
            Triage Queue
          </Link>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Pending Reports (Urgent Triage) */}
        <Link
          href="/admin/reports"
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-rose-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Reports
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
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
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-blue-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Under Investigation
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
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
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-amber-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Unverified Claims
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
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
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-purple-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Advisories
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeAdvisories.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {schedules.length} recurring pickup routes active
            </p>
          </div>
        </Link>
      </div>

      {/* Main Operational Split Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Priority Reports Queue Preview */}
        <div className="neu-card rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-neu-raised space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Immediate Review Queue
              </h2>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center transition-colors"
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
            <div className="space-y-3">
              {reports.slice(0, 4).map((report) => {
                const badge =
                  REPORT_STATUS_BADGES[report.status] ||
                  REPORT_STATUS_BADGES.SUBMITTED;
                return (
                  <div
                    key={report.id}
                    className="neu-socket p-3.5 sm:p-4 rounded-2xl border border-emerald-900/5 hover:border-emerald-900/15 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          REP-{report.id.toString().padStart(4, '0')} &bull; {report.category.replace('_', ' ')}
                        </span>
                        <h3 className="text-xs font-bold text-slate-800 truncate">
                          {report.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                      <div className="flex items-center space-x-1.5 truncate max-w-[220px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{report.location_text}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
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
        <div className="neu-card rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-neu-raised space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                SAB-Points Claims to Verify
              </h2>
            </div>
            <Link
              href="/admin/participation"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center transition-colors"
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
            <div className="space-y-3">
              {claims.slice(0, 4).map((claim) => (
                <div
                  key={claim.id}
                  className="neu-socket p-3.5 sm:p-4 rounded-2xl border border-emerald-900/5 hover:border-emerald-900/15 transition-all space-y-2"
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
                  <h3 className="text-xs font-bold text-slate-800 truncate">
                    {claim.activity_title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                    <span className="font-medium truncate">Resident: {claim.resident_name}</span>
                    <span className="flex-shrink-0">{new Date(claim.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
