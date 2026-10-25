'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  getMyReports,
  getSchedules,
  getAdvisories,
  getAnnouncements,
  getMyPointsSummary,
} from '@/lib/api-client';
import { WasteReport, ReportStatus } from '@/types/reports';
import { ScheduleItem, AdvisoryItem } from '@/types/schedules';
import { AnnouncementItem } from '@/types/announcements';
import { ResidentPointsSummary } from '@/types/gamification';
import {
  Calendar,
  FileText,
  Award,
  Bell,
  PlusCircle,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const STATUS_BADGES: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  SUBMITTED: {
    label: 'Submitted',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  REJECTED: {
    label: 'Closed / Rejected',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

export default function ResidentDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [pointsSummary, setPointsSummary] = useState<ResidentPointsSummary | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        reportsRes,
        schedulesRes,
        advisoriesRes,
        announcementsRes,
        pointsRes,
      ] = await Promise.allSettled([
        getMyReports(),
        getSchedules(),
        getAdvisories(),
        getAnnouncements(),
        getMyPointsSummary(),
      ]);

      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.items || []);
      if (schedulesRes.status === 'fulfilled') setSchedules(schedulesRes.value.items || []);
      if (advisoriesRes.status === 'fulfilled') setAdvisories(advisoriesRes.value.items || []);
      if (announcementsRes.status === 'fulfilled') setAnnouncements(announcementsRes.value.items || []);
      if (pointsRes.status === 'fulfilled') setPointsSummary(pointsRes.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived metrics
  const activeReports = reports.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'].includes(r.status)
  );
  const recentReports = reports.slice(0, 3);
  const activeAdvisories = advisories.filter((a) => a.is_active);
  const recentAnnouncements = announcements.slice(0, 3);

  // Next collection schedule
  const todayIndex = new Date().getDay(); // 0 is Sunday
  const daysOfWeek = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  const currentDayName = daysOfWeek[todayIndex];
  const todaysSchedule = schedules.find((s) => s.day_of_week === currentDayName && s.is_active);
  const upcomingSchedules = schedules.filter((s) => s.is_active).slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-civic-forest to-emerald-800 rounded-2xl text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                Barangay Sabang Resident Portal
              </span>
              <span className="bg-emerald-700/60 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded">
                Verified Resident
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.full_name || 'Resident'}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Track collection trucks, report community waste issues, and earn civic SAB-points for helping keep Barangay Sabang clean and sustainable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors border border-white/15"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/resident/reports"
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white text-civic-forest hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-civic-forest" />
              File Report
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SAB-Points Balance */}
        <Link
          href="/resident/points"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-civic-emerald hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              SAB-Points
            </span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-civic-slate">
              {pointsSummary ? pointsSummary.total_points : 0}{' '}
              <span className="text-xs text-slate-400 font-normal">pts</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">
                {pointsSummary?.tier || 'Eco Volunteer'}
              </span>
            </div>
          </div>
        </Link>

        {/* Active Reports */}
        <Link
          href="/resident/reports"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-civic-emerald hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              My Active Reports
            </span>
            <div className="p-2 bg-emerald-50 rounded-xl text-civic-forest group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-civic-slate">
              {activeReports.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {reports.length} total reports filed
            </p>
          </div>
        </Link>

        {/* Next Collection Schedule */}
        <Link
          href="/resident/schedules"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-civic-emerald hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Collection
            </span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-civic-slate truncate">
              {todaysSchedule ? todaysSchedule.waste_type.replace('_', ' ') : 'No Pickup Today'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {todaysSchedule ? `${todaysSchedule.start_time} - ${todaysSchedule.end_time}` : 'Check weekly timetable'}
            </p>
          </div>
        </Link>

        {/* Barangay Advisories */}
        <Link
          href="/resident/announcements"
          className="bg-white rounded-2xl border border-civic-border p-5 shadow-sm hover:border-civic-emerald hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Barangay Advisories
            </span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-civic-slate">
              {activeAdvisories.length + announcements.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeAdvisories.length > 0 ? `${activeAdvisories.length} urgent notices active` : 'All schedules on-time'}
            </p>
          </div>
        </Link>
      </div>

      {/* Urgent Advisory Callout (if active) */}
      {activeAdvisories.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-800">
                Notice: {activeAdvisories[0].title}
              </span>
              <span className="bg-amber-200/80 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded">
                {activeAdvisories[0].advisory_type.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              {activeAdvisories[0].message}
            </p>
          </div>
          <Link
            href="/resident/schedules"
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center whitespace-nowrap self-center"
          >
            Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      )}

      {/* Main Split Section: Recent Reports vs Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Reports */}
        <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-civic-forest" />
              <h2 className="text-sm font-bold text-civic-slate">
                My Recent Reports
              </h2>
            </div>
            <Link
              href="/resident/reports"
              className="text-xs font-semibold text-civic-forest hover:text-civic-forestHover flex items-center"
            >
              View All ({reports.length})
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-600">
                  No waste reports submitted yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Notice uncollected waste or an illegal dump site? Report it directly to Barangay Sabang.
                </p>
              </div>
              <Link
                href="/resident/reports"
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-civic-forest hover:bg-emerald-100 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Submit Your First Report
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const badge = STATUS_BADGES[report.status] || STATUS_BADGES.SUBMITTED;
                return (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          REP-{report.id.toString().padStart(4, '0')}
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

        {/* Right Column: Latest Announcements & Schedules */}
        <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-civic-forest" />
              <h2 className="text-sm font-bold text-civic-slate">
                Barangay Bulletins
              </h2>
            </div>
            <Link
              href="/resident/announcements"
              className="text-xs font-semibold text-civic-forest hover:text-civic-forestHover flex items-center"
            >
              All Bulletins
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {recentAnnouncements.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No announcements posted at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-civic-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
