'use client';

import { useRealtimeSync } from '@/lib/use-realtime-sync';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  getMyReports,
  getMyPointsSummary,
  getAdvisories,
  getAnnouncements,
  getSchedules,
} from '@/lib/api-client';
import { WasteReport, ReportStatus } from '@/types/reports';
import { ResidentPointsSummary } from '@/types/gamification';
import { AdvisoryItem, ScheduleItem } from '@/types/schedules';
import { AnnouncementItem } from '@/types/announcements';
import {
  Award,
  Calendar,
  FileText,
  PlusCircle,
  Bell,
  AlertTriangle,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Video,
} from 'lucide-react';

const STATUS_BADGES: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  SUBMITTED: {
    label: 'Submitted',
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

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [pointsSummary, setPointsSummary] = useState<ResidentPointsSummary | null>(null);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [reportsRes, pointsRes, advisoriesRes, announcementsRes, schedulesRes] =
        await Promise.allSettled([
          getMyReports(),
          getMyPointsSummary(),
          getAdvisories(),
          getAnnouncements(),
          getSchedules(),
        ]);

      if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.items || []);
      if (pointsRes.status === 'fulfilled') setPointsSummary(pointsRes.value);
      if (advisoriesRes.status === 'fulfilled') setAdvisories(advisoriesRes.value.items || []);
      if (announcementsRes.status === 'fulfilled') setAnnouncements(announcementsRes.value.items || []);
      if (schedulesRes.status === 'fulfilled') setSchedules(schedulesRes.value.items || []);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Automatic background synchronization (< 3s SLA)
  useRealtimeSync(() => loadDashboardData(true), { entity: '*' });

  const activeReports = reports.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'IN_PROGRESS' || r.status === 'UNDER_REVIEW'
  );
  const recentReports = reports.slice(0, 3);
  const activeAdvisories = advisories.filter((a) => a.is_active);
  const recentAnnouncements = announcements.slice(0, 3);

  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayName = daysOfWeek[new Date().getDay()];
  const todaysSchedule = schedules.find((s) => s.day_of_week === todayName && s.is_active);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider">
                Barangay Sabang Resident Portal
              </span>
              <span className="bg-emerald-900/60 text-emerald-200 text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Verified Account
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back{user?.full_name && !user.full_name.toLowerCase().includes('demo') ? `, ${user.full_name.replace(/\s*\(fictional\)/i, '').trim()}` : ''}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Track collection trucks, report community waste concerns, learn sustainability principles, and earn civic SAB-Points for keeping Barangay Sabang clean.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => loadDashboardData()}
              disabled={loading}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all border border-white/20 shadow-sm disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/resident/reports"
              className="neu-btn-secondary bg-white inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold text-civic-forest hover:text-emerald-800 transition-colors shadow-neu-raised whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 mr-1.5 text-emerald-700" />
              File Report
            </Link>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* SAB-Points Balance */}
        <Link
          href="/resident/points"
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-amber-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              SAB-Points
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {pointsSummary ? pointsSummary.total_points : 0}{' '}
              <span className="text-xs text-slate-400 font-normal">pts</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">
                {pointsSummary?.tier || 'Eco Volunteer'}
              </span>
            </div>
          </div>
        </Link>

        {/* My Reports */}
        <Link
          href="/resident/reports"
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-emerald-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              My Active Reports
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeReports.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {reports.length} total reports filed
            </p>
          </div>
        </Link>

        {/* Next Collection Schedule */}
        <Link
          href="/resident/schedules"
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-teal-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Collection
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-slate-800 truncate">
              {todaysSchedule ? todaysSchedule.waste_type.replace('_', ' ') : 'No Pickup Today'}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {todaysSchedule ? `${todaysSchedule.start_time} - ${todaysSchedule.end_time}` : 'Check weekly timetable'}
            </p>
          </div>
        </Link>

        {/* Barangay Bulletins / Advisories */}
        <Link
          href="/resident/announcements"
          className="neu-card-interactive p-5 sm:p-6 rounded-3xl border border-slate-200/70 shadow-neu-raised hover:border-purple-400 transition-all group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Barangay Advisories
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {activeAdvisories.length + announcements.length}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              {activeAdvisories.length > 0 ? `${activeAdvisories.length} urgent notices active` : 'All schedules on-time'}
            </p>
          </div>
        </Link>
      </div>

      {/* AwarenessHub Spotlight Card */}
      <div className="neu-card rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-neu-raised flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                Multimedia Education
              </span>
              <span className="text-xs text-slate-400 font-medium">&bull; UN SDGs 11 &amp; 12</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Explore the AwarenessHub: Solid Waste, Climate &amp; Video Guides
            </h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Watch video tutorials on proper waste segregation, learn RA 9003 policies, and discover home composting practices tailored for Barangay Sabang residents.
            </p>
          </div>
        </div>
        <Link
          href="/resident/awareness"
          className="inline-flex items-center px-5 py-3 rounded-xl text-xs font-bold bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 transition-colors whitespace-nowrap self-stretch md:self-center justify-center flex-shrink-0"
        >
          <Video className="w-4 h-4 mr-2" />
          Open AwarenessHub
          <ArrowRight className="w-3.5 h-3.5 ml-2" />
        </Link>
      </div>

      {/* Urgent Advisory Callout (if active) */}
      {activeAdvisories.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start space-x-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
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
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center whitespace-nowrap self-center"
          >
            Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      )}

      {/* Main Split Section: Recent Reports vs Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Reports */}
        <div className="neu-card rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-neu-raised space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                My Recent Reports
              </h2>
            </div>
            <Link
              href="/resident/reports"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center transition-colors"
            >
              View All ({reports.length})
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">
                  No waste reports submitted yet
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Notice uncollected waste or an illegal dump site? Report it directly to Barangay Sabang.
                </p>
              </div>
              <Link
                href="/resident/reports"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
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
                    className="neu-socket p-3.5 sm:p-4 rounded-2xl border border-emerald-900/5 hover:border-emerald-900/15 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          REP-{report.id.toString().padStart(4, '0')}
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

        {/* Right Column: Latest Announcements & Schedules */}
        <div className="neu-card rounded-3xl border border-slate-200/70 p-6 sm:p-8 shadow-neu-raised space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Barangay Bulletins
              </h2>
            </div>
            <Link
              href="/resident/announcements"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center transition-colors"
            >
              All Bulletins
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {recentAnnouncements.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No announcements posted at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((item) => (
                <div
                  key={item.id}
                  className="neu-socket p-3.5 sm:p-4 rounded-2xl border border-emerald-900/5 hover:border-emerald-900/15 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 truncate">
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
