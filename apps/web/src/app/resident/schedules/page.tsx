'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Recycle,
  Sparkles,
  ChevronRight,
  Info,
  Bell,
  BellRing,
  Check,
  Search,
  Table as TableIcon,
  LayoutGrid,
  X,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  getSchedules,
  getAdvisories,
  getScheduleAreas,
  subscribeScheduleNotification,
  AreaItem,
} from '@/lib/api-client';
import {
  ScheduleItem,
  AdvisoryItem,
  DayOfWeek,
  WasteType,
} from '@/types/schedules';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABELS: Record<DayOfWeek, { short: string; full: string; badgeBg: string }> = {
  MONDAY: { short: 'Mon', full: 'Monday', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  TUESDAY: { short: 'Tue', full: 'Tuesday', badgeBg: 'bg-teal-100 text-teal-900 border-teal-300' },
  WEDNESDAY: { short: 'Wed', full: 'Wednesday', badgeBg: 'bg-sky-100 text-sky-900 border-sky-300' },
  THURSDAY: { short: 'Thu', full: 'Thursday', badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  FRIDAY: { short: 'Fri', full: 'Friday', badgeBg: 'bg-purple-100 text-purple-900 border-purple-300' },
  SATURDAY: { short: 'Sat', full: 'Saturday', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300' },
  SUNDAY: { short: 'Sun', full: 'Sunday', badgeBg: 'bg-rose-100 text-rose-900 border-rose-300' },
};

const WASTE_TYPE_CONFIG: Record<
  WasteType,
  { label: string; badgeClass: string; borderClass: string; icon: React.ElementType }
> = {
  BIODEGRADABLE: {
    label: 'Biodegradable (Nabubulok)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    borderClass: 'border-l-4 border-l-emerald-600',
    icon: CheckCircle2,
  },
  NON_BIODEGRADABLE: {
    label: 'Non-Biodegradable (Di-nabubulok)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    borderClass: 'border-l-4 border-l-slate-600',
    icon: Trash2,
  },
  RECYCLABLE: {
    label: 'Recyclable (Mareresiklo)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    borderClass: 'border-l-4 border-l-blue-600',
    icon: Recycle,
  },
  SPECIAL_HAZARDOUS: {
    label: 'Special / Hazardous Waste',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    borderClass: 'border-l-4 border-l-amber-600',
    icon: AlertTriangle,
  },
};

const STORAGE_KEY_NOTIFICATIONS = 'sabtrack_subscribed_schedules';

export default function ResidentSchedulesPage() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(
    user?.area_id || null
  );
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notification Modal & state
  const [notifyModalSchedule, setNotifyModalSchedule] = useState<ScheduleItem | null>(null);
  const [emailInput, setEmailInput] = useState<string>('');
  const [submittingNotification, setSubmittingNotification] = useState<boolean>(false);
  const [notificationFeedback, setNotificationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [subscribedScheduleIds, setSubscribedScheduleIds] = useState<Record<number, string>>({});

  // Load subscriptions from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) {
        setSubscribedScheduleIds(JSON.parse(saved));
      }
    } catch {
      // LocalStorage not available or parse error
    }
  }, []);

  // Fetch areas
  useEffect(() => {
    async function loadAreas() {
      try {
        const areaList = await getScheduleAreas();
        setAreas(areaList);
      } catch (err) {
        console.error('Failed to load areas:', err);
      }
    }
    loadAreas();
  }, []);

  // Fetch schedules & advisories
  const loadScheduleData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedRes, advRes] = await Promise.all([
        getSchedules({ areaId: selectedAreaId || undefined }),
        getAdvisories({ areaId: selectedAreaId || undefined }),
      ]);
      setSchedules(schedRes.items);
      setAdvisories(advRes.items);
    } catch (err) {
      setError('Unable to load collection schedules. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedAreaId]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Filtered schedules for Table and Cards
  const filteredSchedules = schedules.filter((item) => {
    if (selectedDay && item.day_of_week !== selectedDay) return false;
    if (selectedWasteType && item.waste_type !== selectedWasteType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchArea = item.area_name?.toLowerCase().includes(q);
      const matchDay = item.day_of_week.toLowerCase().includes(q);
      const matchWaste = item.waste_type.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      if (!matchArea && !matchDay && !matchWaste && !matchNotes) return false;
    }
    return true;
  });

  // Group filtered schedules by day of week for Card View
  const schedulesByDay = DAYS_OF_WEEK.reduce<Record<DayOfWeek, ScheduleItem[]>>(
    (acc, day) => {
      acc[day] = filteredSchedules.filter((s) => s.day_of_week === day);
      return acc;
    },
    {} as Record<DayOfWeek, ScheduleItem[]>
  );

  // Handle open Notify modal
  const handleOpenNotify = (item: ScheduleItem) => {
    setNotifyModalSchedule(item);
    setEmailInput(subscribedScheduleIds[item.id] || user?.email || '');
    setNotificationFeedback(null);
  };

  // Submit email notification subscription
  const handleConfirmNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyModalSchedule) return;

    const emailToUse = emailInput.trim() || user?.email || '';
    if (!emailToUse || !emailToUse.includes('@')) {
      setNotificationFeedback({
        type: 'error',
        message: 'Please provide a valid recipient email address.',
      });
      return;
    }

    setSubmittingNotification(true);
    setNotificationFeedback(null);

    try {
      const res = await subscribeScheduleNotification(notifyModalSchedule.id, emailToUse);
      const updated = {
        ...subscribedScheduleIds,
        [notifyModalSchedule.id]: res.recipient_email,
      };
      setSubscribedScheduleIds(updated);
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
      } catch {
        // Storage quota
      }

      setNotificationFeedback({
        type: 'success',
        message: res.message || `Subscribed! Reminders will be emailed to ${res.recipient_email}.`,
      });

      // Auto close after 2.5 seconds on success
      setTimeout(() => {
        setNotifyModalSchedule(null);
      }, 2500);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to register notification reminder.';
      setNotificationFeedback({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setSubmittingNotification(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
              Barangay Sabang Logistics
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">RA 9003 Timetable</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-emerald-700" />
            Garbage Collection Schedules
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Official pickup timetables, truck route logistics, and email reminder notifications for Barangay Sabang.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="neu-socket p-1 rounded-2xl flex items-center">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-neu-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Switch to Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-neu-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Switch to Card Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
          </div>

          <button
            onClick={loadScheduleData}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white/70 border border-slate-200 rounded-xl hover:bg-white shadow-neu-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-card rounded-2xl border border-emerald-900/10 p-5 shadow-neu-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search schedule by purok, day, waste type, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm neu-input rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Purok / Area Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedAreaId || ''}
              onChange={(e) =>
                setSelectedAreaId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm neu-input rounded-xl text-slate-800 focus:outline-none"
            >
              <option value="">All Puroks / Sectors</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week Filter */}
          <div className="w-full sm:w-44">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm neu-input rounded-xl text-slate-800 focus:outline-none"
            >
              <option value="">All Days</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d].full}
                </option>
              ))}
            </select>
          </div>

          {/* Waste Category Filter */}
          <div className="w-full sm:w-52">
            <select
              value={selectedWasteType}
              onChange={(e) => setSelectedWasteType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm neu-input rounded-xl text-slate-800 focus:outline-none"
            >
              <option value="">All Waste Categories</option>
              <option value="BIODEGRADABLE">Biodegradable (Nabubulok)</option>
              <option value="NON_BIODEGRADABLE">Non-Biodegradable (Di-nabubulok)</option>
              <option value="RECYCLABLE">Recyclable (Mareresiklo)</option>
              <option value="SPECIAL_HAZARDOUS">Special / Hazardous</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Notification Hint */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredSchedules.length}</span> of{' '}
            <span className="font-bold text-slate-800">{schedules.length}</span> scheduled pickups
          </div>
          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 text-[11px] font-semibold">
            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
            <span>Click &ldquo;Notify Me&rdquo; on any schedule to receive automated email reminders</span>
          </div>
        </div>
      </div>

      {/* Route Modification / Delay Advisories Banner */}
      {advisories.length > 0 && (
        <div className="space-y-3">
          {advisories.map((advisory) => (
            <div
              key={advisory.id}
              className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 shadow-sm flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-amber-900 text-sm">
                    {advisory.title}
                  </h3>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    Effective: {advisory.effective_date}
                  </span>
                </div>
                <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                  {advisory.message}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-amber-700">
                  <span>Scope: {advisory.area_name || 'All Barangay Areas'}</span>
                  <span>Issued by: {advisory.created_by_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* TABLE VIEW (Primary / Default) */}
      {viewMode === 'table' ? (
        <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80 shadow-neu-xs">
                <tr>
                  <th scope="col" className="px-5 py-4">Day &amp; Time Window</th>
                  <th scope="col" className="px-5 py-4">Waste Stream Category</th>
                  <th scope="col" className="px-5 py-4">Purok / Sector</th>
                  <th scope="col" className="px-5 py-4">Pickup Notes &amp; Rules</th>
                  <th scope="col" className="px-5 py-4 text-center">Email Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-[#edf2f7]/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading collection timetable...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700">No collection schedules found.</p>
                        <p className="text-xs text-slate-400">
                          Try adjusting your search terms or Purok filter above.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((item) => {
                    const config = WASTE_TYPE_CONFIG[item.waste_type];
                    const IconComponent = config.icon;
                    const dayMeta = DAY_LABELS[item.day_of_week];
                    const isSubscribed = Boolean(subscribedScheduleIds[item.id]);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-white/70 transition-colors"
                      >
                        {/* Day & Time Column */}
                        <td className="px-5 py-4 align-middle whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`neu-chip px-3 py-1 rounded-xl text-xs font-bold shadow-neu-xs border border-white/80 ${dayMeta.badgeBg}`}
                            >
                              {dayMeta.full}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>{item.start_time} - {item.end_time}</span>
                            </div>
                          </div>
                        </td>

                        {/* Waste Stream Category */}
                        <td className="px-5 py-4 align-middle">
                          <span
                            className={`neu-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-white/80 shadow-neu-xs text-xs font-bold ${config.badgeClass}`}
                          >
                            <IconComponent className="w-4 h-4 flex-shrink-0" />
                            <span>{config.label}</span>
                          </span>
                        </td>

                        {/* Purok / Sector */}
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                            <span>{item.area_name || 'All Barangay Sectors'}</span>
                          </div>
                        </td>

                        {/* Pickup Notes / Instructions */}
                        <td className="px-5 py-4 align-middle text-slate-600 max-w-xs">
                          {item.notes ? (
                            <span className="text-xs italic leading-relaxed text-slate-700">{item.notes}</span>
                          ) : (
                            <span className="text-xs text-slate-400">Place bags curbside before collection window</span>
                          )}
                        </td>

                        {/* Notify Me Button */}
                        <td className="px-5 py-4 align-middle text-center whitespace-nowrap">
                          {isSubscribed ? (
                            <button
                              type="button"
                              onClick={() => handleOpenNotify(item)}
                              className="neu-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-neu-green"
                              title={`Active reminders for ${subscribedScheduleIds[item.id]}`}
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Notified</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenNotify(item)}
                              className="neu-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 rounded-xl shadow-neu-sm transition-all"
                            >
                              <Bell className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Notify Me</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedules = schedulesByDay[day];
            const hasCollection = daySchedules.length > 0;

            return (
              <div
                key={day}
                className={`neu-card rounded-3xl border border-emerald-900/10 shadow-neu-raised overflow-hidden flex flex-col ${
                  hasCollection ? '' : 'opacity-80'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-5 py-4 flex items-center justify-between border-b ${
                    hasCollection
                      ? 'bg-emerald-50/50 border-emerald-900/10'
                      : 'bg-slate-50/30 border-slate-200/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {DAY_LABELS[day].full}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      hasCollection
                        ? 'bg-emerald-100 text-civic-forest border border-emerald-200'
                        : 'bg-slate-200/60 text-slate-600'
                    }`}
                  >
                    {hasCollection ? `${daySchedules.length} Pickup` : 'No Pickup'}
                  </span>
                </div>

                {/* Day Content */}
                <div className="p-4 space-y-3.5 flex-1">
                  {hasCollection ? (
                    daySchedules.map((item) => {
                      const config = WASTE_TYPE_CONFIG[item.waste_type];
                      const IconComponent = config.icon;
                      const isSubscribed = Boolean(subscribedScheduleIds[item.id]);

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl bg-white/80 border ${config.borderClass} space-y-2 text-xs shadow-sm hover:shadow-md transition-all`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${config.badgeClass}`}
                            >
                              <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{config.label}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {item.start_time} - {item.end_time}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.area_name || 'All Sectors'}</span>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-1.5">
                              {item.notes}
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                            {isSubscribed ? (
                              <button
                                type="button"
                                onClick={() => handleOpenNotify(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
                              >
                                <Check className="w-3 h-3" />
                                <span>Notified</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenNotify(item)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-sm"
                              >
                                <Bell className="w-3 h-3 text-emerald-700" />
                                <span>Notify Me</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center py-8 text-slate-400 text-xs text-center font-medium">
                      No scheduled collection for this day.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Segregation Rules Reference Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-emerald-700" />
          Barangay Sabang Waste Segregation Guidelines
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
            <span className="font-bold text-emerald-800 block mb-1">
              🌱 Biodegradable (Green Bag)
            </span>
            <p className="text-slate-600 leading-relaxed">
              Kitchen scraps, vegetable peelings, leftover food, dry leaves, garden cuttings.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="font-bold text-slate-800 block mb-1">
              🗑️ Non-Biodegradable (Black Bag)
            </span>
            <p className="text-slate-600 leading-relaxed">
              Sanitary napkins, disposable diapers, styrofoam, contaminated wrappers, soiled plastic.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
            <span className="font-bold text-blue-800 block mb-1">
              ♻️ Recyclable (White/Clear Bag)
            </span>
            <p className="text-slate-600 leading-relaxed">
              Clean PET bottles, clean cardboard, tin cans, dry paper, glass bottles.
            </p>
          </div>
        </div>
      </div>

      {/* NOTIFY ME MODAL DIALOG */}
      {notifyModalSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-emerald-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Collection Reminder
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Automated Email Alert System
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifyModalSchedule(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Schedule Slot Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Day of Week:</span>
                <span className="font-bold text-slate-800">
                  {DAY_LABELS[notifyModalSchedule.day_of_week].full}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Time Window:</span>
                <span className="font-bold text-slate-800">
                  {notifyModalSchedule.start_time} - {notifyModalSchedule.end_time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Waste Category:</span>
                <span className="font-bold text-emerald-800">
                  {WASTE_TYPE_CONFIG[notifyModalSchedule.waste_type].label}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Purok / Sector:</span>
                <span className="font-bold text-slate-800">
                  {notifyModalSchedule.area_name || 'All Barangay Sectors'}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmNotification} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reminder-email-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Notification Email Address</span>
                </label>
                <input
                  id="reminder-email-input"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="resident@example.com"
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Reminders are dispatched 1 hour prior to the scheduled pickup time.
                </p>
              </div>

              {/* Feedback messages */}
              {notificationFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    notificationFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {notificationFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{notificationFeedback.message}</span>
                </div>
              )}

              {/* Privacy compliance notice */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>RA 10173 Protected: Email is used strictly for pickup advisories.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNotifyModalSchedule(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotification}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {submittingNotification ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Notify Me</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
