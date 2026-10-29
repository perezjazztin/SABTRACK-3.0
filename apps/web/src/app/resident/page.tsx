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
  MapPin,
  ChevronRight,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Video,
  Truck,
  Camera,
  Trophy,
  Check,
  Leaf,
} from 'lucide-react';

/* ---------- constants ---------- */

const LIME = 'bg-[#b6f23a]';

const STATUS_BADGES: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  SUBMITTED: { label: 'Submitted', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

// Progress steps shown on each report card
const REPORT_STEPS: ReportStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'];

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_STYLES: Record<string, string> = {
  CLEANUP_DRIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  HOLIDAY_SCHEDULE: 'bg-sky-50 text-sky-800 border-sky-200',
  POLICY_UPDATE: 'bg-violet-50 text-violet-800 border-violet-200',
};

const pretty = (s?: string) => (s ? s.replace(/_/g, ' ') : '');

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ---------- small building blocks ---------- */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

function PointsRing({ value, size = 84 }: { value: number; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(value, 0), 1));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#b6f23a"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

function ReportProgress({ status }: { status: ReportStatus }) {
  if (status === 'REJECTED') {
    return <p className="text-[11px] font-medium text-slate-500">This report was closed without action.</p>;
  }
  const current = REPORT_STEPS.indexOf(status);
  return (
    <div className="flex items-center">
      {REPORT_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <React.Fragment key={step}>
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${done ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                }`}
              title={STATUS_BADGES[step].label}
            >
              {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
            </div>
            {i < REPORT_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${i < current ? 'bg-emerald-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------- page ---------- */

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

  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];
  const todaysSchedules = schedules.filter((s) => s.day_of_week === todayName && s.is_active);
  const todaysSchedule = todaysSchedules[0];

  const totalPoints = pointsSummary?.total_points ?? 0;
  const nextMilestone = (Math.floor(totalPoints / 100) + 1) * 100;
  const ringProgress = (totalPoints % 100) / 100;

  const firstName = (() => {
    const n = user?.full_name;
    if (!n || n.toLowerCase().includes('demo')) return '';
    return n.replace(/\s*\(fictional\)/i, '').trim().split(' ')[0];
  })();

  const todayLabel = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b5d3f] via-[#0a6b48] to-[#0f5a52] p-5 text-white shadow-[0_20px_50px_-20px_rgba(6,78,59,0.6)] sm:p-7">
        {/* concentric rings, echoing the landing page */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#b6f23a]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <Leaf className="h-3.5 w-3.5 text-[#b6f23a]" />
                Barangay Sabang Resident Portal
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b6f23a]/30 bg-[#b6f23a]/10 px-3 py-1 text-xs font-medium text-[#d5fb8a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b6f23a]" />
                Verified account
              </span>
            </div>

            <h1 className="text-2xl font-extrabold leading-[1.1] tracking-tight sm:text-3xl">
              {greeting()}
              {firstName ? `, ${firstName}` : ''}.
              <span className="mt-1 block text-white/60">Let&apos;s keep Sabang clean.</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-emerald-50/80">
              {todaysSchedule
                ? `The ${pretty(todaysSchedule.waste_type).toLowerCase()} truck is scheduled today, ${todaysSchedule.start_time} to ${todaysSchedule.end_time}.`
                : 'No truck is scheduled today. Spot a problem? File a report and earn SAB-Points.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/resident/reports"
                className={`inline-flex items-center gap-2 rounded-full ${LIME} px-5 py-2.5 text-sm font-bold text-emerald-950 shadow-lg shadow-lime-400/20 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
              >
                <PlusCircle className="h-4 w-4" />
                File a report
              </Link>
              <button
                onClick={() => loadDashboardData()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
                title="Refresh dashboard"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* date + live pulse */}
          <div className="flex items-center gap-3 self-start rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur lg:self-end">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-100/70">Today</p>
              <p className="text-sm font-bold">{todayLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BENTO KPI ================= */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {/* Points: the featured tile */}
        <Link
          href="/resident/points"
          className="group relative overflow-hidden rounded-2xl bg-[#082f23] p-4 text-white shadow-sm transition hover:shadow-xl sm:col-span-2 lg:col-span-5"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#b6f23a]/15 blur-3xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-100/70">
                <Award className="h-4 w-4 text-[#b6f23a]" />
                SAB-Points
              </div>
              {loading && !pointsSummary ? (
                <Skeleton className="mt-4 h-12 w-32 !bg-white/10" />
              ) : (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-[#b6f23a]">{totalPoints}</span>
                  <span className="text-sm text-emerald-100/60">pts</span>
                </div>
              )}
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                <Trophy className="h-3.5 w-3.5 text-[#b6f23a]" />
                {pointsSummary?.tier || 'Eco Volunteer'}
              </span>
              <p className="mt-3 text-xs text-emerald-100/60">
                {nextMilestone - totalPoints} pts to your next {nextMilestone}-pt milestone
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <PointsRing value={ringProgress} />
              <div className="absolute inset-0 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-white/70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </Link>

        {/* Active reports */}
        <Link
          href="/resident/reports"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg lg:col-span-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active reports</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FileText className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3">
            {loading && reports.length === 0 ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              <div className="text-3xl font-black tracking-tight text-slate-900">{activeReports.length}</div>
            )}
            <p className="mt-2 text-xs text-slate-500">{reports.length} filed in total</p>
          </div>
        </Link>

        {/* Today's collection */}
        <Link
          href="/resident/schedules"
          className={`group flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg lg:col-span-2 ${todaysSchedule
              ? 'border-teal-300 bg-gradient-to-br from-teal-50 to-white'
              : 'border-slate-200/80 bg-white hover:border-teal-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Today</span>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Truck className="h-5 w-5" />
              {todaysSchedule && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-70" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500" />
                </span>
              )}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-base font-bold leading-tight text-slate-900">
              {todaysSchedule ? pretty(todaysSchedule.waste_type) : 'No pickup'}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {todaysSchedule ? `${todaysSchedule.start_time} – ${todaysSchedule.end_time}` : 'Enjoy your day'}
            </p>
          </div>
        </Link>

        {/* Advisories */}
        <Link
          href="/resident/announcements"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Updates</span>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Bell className="h-5 w-5" />
              {activeAdvisories.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {activeAdvisories.length}
                </span>
              )}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {activeAdvisories.length + announcements.length}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {activeAdvisories.length > 0 ? `${activeAdvisories.length} urgent` : 'All on schedule'}
            </p>
          </div>
        </Link>
      </section>

      {/* ================= URGENT ADVISORY ================= */}
      {activeAdvisories.length > 0 && (
        <section className="relative flex items-start gap-4 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/40 p-4 pl-5 sm:items-center">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-400" />
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-amber-950">{activeAdvisories[0].title}</h3>
              <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                {pretty(activeAdvisories[0].advisory_type)}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/80 sm:text-sm">
              {activeAdvisories[0].message}
            </p>
          </div>
          <Link
            href="/resident/schedules"
            className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-amber-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-950 sm:inline-flex"
          >
            Details <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      {/* ================= WEEKLY STRIP ================= */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">This week&apos;s collection</h2>
          <Link href="/resident/schedules" className="flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800">
            Full timetable <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, i) => {
            const items = schedules.filter((s) => s.day_of_week === day && s.is_active);
            const isToday = i === todayIndex;
            return (
              <div
                key={day}
                className={`flex min-h-[68px] flex-col items-center justify-between rounded-2xl border px-1 py-2 text-center transition ${isToday
                    ? 'border-emerald-700 bg-emerald-800 text-white shadow-md'
                    : items.length > 0
                      ? 'border-emerald-100 bg-emerald-50/60 text-slate-800'
                      : 'border-slate-100 bg-slate-50/60 text-slate-400'
                  }`}
              >
                <span className={`text-xs font-semibold ${isToday ? 'text-emerald-100' : ''}`}>{DAY_SHORT[i]}</span>
                {items.length > 0 ? (
                  <>
                    <Truck className={`h-4 w-4 ${isToday ? 'text-[#b6f23a]' : 'text-emerald-600'}`} />
                    <span className="line-clamp-1 w-full px-1 text-[10px] font-medium leading-tight">
                      {pretty(items[0].waste_type)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg leading-none">·</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= QUICK ACTIONS ================= */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: '/resident/reports', icon: Camera, title: 'Report an incident', sub: 'Photo, location, done in a minute' },
          { href: '/resident/schedules', icon: Truck, title: 'Check the truck schedule', sub: 'Know when to put out your waste' },
          { href: '/resident/points', icon: Trophy, title: 'See the leaderboard', sub: 'Climb your purok ranking' },
        ].map(({ href, icon: Icon, title, sub }) => (
          <Link
            key={title}
            href={href}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{title}</p>
              <p className="truncate text-xs text-slate-500">{sub}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600" />
          </Link>
        ))}
      </section>

      {/* ================= REPORTS + BULLETINS ================= */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Reports */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-slate-900">My recent reports</h2>
            <Link href="/resident/reports" className="flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800">
              View all ({reports.length}) <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {loading && reports.length === 0 ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : recentReports.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">No reports yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
                  See uncollected waste or an illegal dump site? Report it to Barangay Sabang.
                </p>
              </div>
              <Link
                href="/resident/reports"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                File your first report
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const badge = STATUS_BADGES[report.status] || STATUS_BADGES.SUBMITTED;
                return (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          REP-{report.id.toString().padStart(4, '0')}
                        </span>
                        <h3 className="truncate text-sm font-bold text-slate-900">{report.title}</h3>
                      </div>
                      <span
                        className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    <div className="my-3">
                      <ReportProgress status={report.status} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{report.location_text}</span>
                      </span>
                      <span className="ml-3 flex flex-shrink-0 items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bulletins */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-slate-900">Barangay bulletins</h2>
            <Link href="/resident/announcements" className="flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800">
              All bulletins <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {loading && announcements.length === 0 ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : recentAnnouncements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">No announcements right now. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${CATEGORY_STYLES[item.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                    >
                      {pretty(item.category)}
                    </span>
                    <span className="flex-shrink-0 text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{item.content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= AWARENESS HUB ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b5d3f] to-[#082f23] p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-10 right-4 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute left-1/4 top-0 h-48 w-48 rounded-full bg-[#b6f23a]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <span className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur sm:flex">
              <BookOpen className="h-7 w-7 text-[#b6f23a]" />
            </span>
            <div className="max-w-xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                Learn · UN SDGs 11 &amp; 12
              </span>
              <h3 className="mt-3 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                Learn to sort waste the right way.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-50/75">
                Watch short video guides on segregation, understand RA 9003, and start composting at home.
              </p>
            </div>
          </div>
          <Link
            href="/resident/awareness"
            className={`inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full ${LIME} px-5 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-lime-400/20 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
          >
            <Video className="h-4 w-4" />
            Open AwarenessHub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}