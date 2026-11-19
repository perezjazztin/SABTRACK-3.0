'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRealtimeSync } from '@/lib/use-realtime-sync';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Recycle,
  Bell,
  BellRing,
  Check,
  Table as TableIcon,
  LayoutGrid,
  X,
  Mail,
  Truck,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getSchedules, subscribeScheduleNotification } from '@/lib/api-client';
import { ScheduleItem, DayOfWeek, WasteType } from '@/types/schedules';

// -------------------------------------------------------------
// 1. DATA STRUCTURES & DEFINITIONS (unchanged values)
// -------------------------------------------------------------

export interface SabangLocation {
  name: string;
  sectorId: number;
  sectorName: string;
  days: string;
  scheduleDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  timeWindow: string;
  bioDays: string;
  nonBioDays: string;
}

const STD_WINDOW = '6:00 AM – 10:00 AM';

function sectorLocations(
  names: string[],
  base: Omit<SabangLocation, 'name'>
): SabangLocation[] {
  return names.map((name) => ({ name, ...base }));
}

export const SABANG_LOCATIONS: SabangLocation[] = [
  {
    name: 'General Luna St.',
    sectorId: 1,
    sectorName: 'General Luna St.',
    days: 'Daily Scheduled Pickup',
    scheduleDays: [1, 2, 3, 4, 5, 6, 0],
    timeWindow: '6:00 AM – 9:00 AM',
    bioDays: 'Mon, Wed, Fri, Sat, Sun',
    nonBioDays: 'Tue & Thu',
  },
  ...sectorLocations(
    ['Centro', 'Cabal', 'Duhatan', 'South Valley', 'Sauz', 'Llamar', 'Liams', 'Ladeco', 'Lynville', 'Athenians'],
    {
      sectorId: 2,
      sectorName: 'Sector 1 (Monday & Thursday)',
      days: 'Monday & Thursday',
      scheduleDays: [1, 4],
      timeWindow: STD_WINDOW,
      bioDays: 'Monday & Thursday',
      nonBioDays: 'Monday & Thursday (Segregated)',
    }
  ),
  ...sectorLocations(
    ['Monte Claro', 'P. Laygo', 'GBLMIS', 'Monte Flora', 'Monte Carlo', 'Silverlaz', 'Sona', 'Greenville', 'Mindanao', 'Malleta'],
    {
      sectorId: 3,
      sectorName: 'Sector 2 (Tuesday & Friday)',
      days: 'Tuesday & Friday',
      scheduleDays: [2, 5],
      timeWindow: STD_WINDOW,
      bioDays: 'Tuesday & Friday',
      nonBioDays: 'Tuesday & Friday (Segregated)',
    }
  ),
  ...sectorLocations(
    ['City Park & 105', 'SVDL II (Phase 1-3)', 'SVDL III', 'Lucky Homes', 'Golden Homes', 'Bahayang Pilipino'],
    {
      sectorId: 4,
      sectorName: 'Sector 3 (Wednesday & Saturday)',
      days: 'Wednesday & Saturday',
      scheduleDays: [3, 6],
      timeWindow: STD_WINDOW,
      bioDays: 'Wednesday & Saturday',
      nonBioDays: 'Wednesday & Saturday (with Recyclables)',
    }
  ),
];

export interface SectorDefinition {
  id: number;
  title: string;
  badge: string;
  scheduleSummary: string;
  timeWindow: string;
  subdivisions: string[];
  rulesHighlight: string;
}

export const SECTOR_CARDS: SectorDefinition[] = [
  {
    id: 1,
    title: 'General Luna St.',
    badge: 'Main Arterial Corridor',
    scheduleSummary: 'Daily Scheduled Collections',
    timeWindow: '6:00 AM – 9:00 AM',
    subdivisions: ['General Luna Street (Commercial & Residential)'],
    rulesHighlight:
      'Mon, Wed, Fri, Sat, Sun: Basurang Nabubulok | Tue & Thu: Basurang Hindi Nabubulok. Ilabas sa tapat bago dumating ang trak.',
  },
  {
    id: 2,
    title: 'Sector 1',
    badge: 'North & West Subdivisions',
    scheduleSummary: 'Every Monday & Thursday',
    timeWindow: STD_WINDOW,
    subdivisions: ['Centro', 'Cabal', 'Duhatan', 'South Valley', 'Sauz', 'Llamar', 'Liams', 'Ladeco', 'Lynville', 'Athenians'],
    rulesHighlight:
      'Ihiwalay ang nabubulok (berdeng sako) at di-nabubulok (itim/selyado). Mahigpit na ipinatutupad ang RA 9003 at Ordinance No. 01-2022.',
  },
  {
    id: 3,
    title: 'Sector 2',
    badge: 'Central & East Subdivisions',
    scheduleSummary: 'Every Tuesday & Friday',
    timeWindow: STD_WINDOW,
    subdivisions: ['P. Laygo', 'GBLMIS', 'Monte Claro', 'Monte Flora', 'Monte Carlo', 'Silverlaz', 'Sona', 'Greenville', 'Mindanao', 'Malleta'],
    rulesHighlight:
      'Curbside and corner pickup points. Mahigpit na ipinagbabawal ang paghalo ng basurang nabubulok at di-nabubulok.',
  },
  {
    id: 4,
    title: 'Sector 3',
    badge: 'South Communities & Housing',
    scheduleSummary: 'Every Wednesday & Saturday',
    timeWindow: STD_WINDOW,
    subdivisions: ['City Park & 105', 'SVDL II (Phase 1-3)', 'SVDL III', 'Lucky Homes', 'Golden Homes', 'Bahayang Pilipino'],
    rulesHighlight:
      'Tuwing Miyerkules at Sabado. Ang mga tuyong mareresiklo (bote, lata, karton) ay sinasabay sa hakot tuwing Sabado.',
  },
];

function formatSectorLabel(label: string): string {
  return label.replace(/^(Sector [123]) \([^)]*\)$/, '$1');
}

const LIME = 'bg-[#b6f23a]';

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
  MONDAY: { short: 'Mon', full: 'Monday', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  TUESDAY: { short: 'Tue', full: 'Tuesday', badgeBg: 'bg-teal-50 text-teal-800 border-teal-200' },
  WEDNESDAY: { short: 'Wed', full: 'Wednesday', badgeBg: 'bg-sky-50 text-sky-800 border-sky-200' },
  THURSDAY: { short: 'Thu', full: 'Thursday', badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  FRIDAY: { short: 'Fri', full: 'Friday', badgeBg: 'bg-violet-50 text-violet-800 border-violet-200' },
  SATURDAY: { short: 'Sat', full: 'Saturday', badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  SUNDAY: { short: 'Sun', full: 'Sunday', badgeBg: 'bg-rose-50 text-rose-800 border-rose-200' },
};

const WASTE_TYPE_CONFIG: Record<
  WasteType,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  BIODEGRADABLE: {
    label: 'Biodegradable (Nabubulok)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  },
  NON_BIODEGRADABLE: {
    label: 'Non-Biodegradable (Di-nabubulok)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: Trash2,
  },
  RECYCLABLE: {
    label: 'Recyclable (Mareresiklo)',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: Recycle,
  },
  SPECIAL_HAZARDOUS: {
    label: 'Special / Hazardous Waste',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: AlertTriangle,
  },
};

// -------------------------------------------------------------
// One row per pickup day: waste types collected together are merged
// -------------------------------------------------------------

interface ScheduleGroup {
  key: string;
  day_of_week: DayOfWeek;
  start_time: ScheduleItem['start_time'];
  end_time: ScheduleItem['end_time'];
  area_id: ScheduleItem['area_id'];
  area_name: ScheduleItem['area_name'];
  items: ScheduleItem[]; // one per waste type, in a fixed order
  notes: string[];
}

const WASTE_ORDER = Object.keys(WASTE_TYPE_CONFIG) as WasteType[];

function groupSchedules(items: ScheduleItem[]): ScheduleGroup[] {
  const map = new Map<string, ScheduleGroup>();

  for (const item of items) {
    const key = [
      item.day_of_week,
      item.start_time ?? '',
      item.end_time ?? '',
      item.area_id ?? item.area_name ?? '',
    ].join('|');

    let group = map.get(key);
    if (!group) {
      group = {
        key,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        area_id: item.area_id,
        area_name: item.area_name,
        items: [],
        notes: [],
      };
      map.set(key, group);
    }
    group.items.push(item);
    if (item.notes && !group.notes.includes(item.notes)) group.notes.push(item.notes);
  }

  const groups = Array.from(map.values());
  for (const g of groups) {
    g.items.sort((a, b) => WASTE_ORDER.indexOf(a.waste_type) - WASTE_ORDER.indexOf(b.waste_type));
  }

  // Sector, then weekday (Mon to Sun), then start time
  groups.sort(
    (a, b) =>
      String(a.area_name ?? '').localeCompare(String(b.area_name ?? ''), undefined, { numeric: true }) ||
      DAYS_OF_WEEK.indexOf(a.day_of_week) - DAYS_OF_WEEK.indexOf(b.day_of_week) ||
      String(a.start_time ?? '').localeCompare(String(b.start_time ?? ''))
  );

  return groups;
}

function WasteChip({ type }: { type: WasteType }) {
  const config = WASTE_TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${config.badgeClass}`}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {config.label}
    </span>
  );
}

const SUN_FIRST_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SUN_FIRST_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STORAGE_KEY_NOTIFICATIONS = 'sabtrack_subscribed_schedules';

// "08:00" / "08:00:00" -> "8:00 AM"; anything unparseable is shown as-is
function fmtTime(t?: string | null) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  return `${h % 12 || 12}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const GROUPS: { label: string; sectorId: number }[] = [
  { label: 'Main Thoroughfare', sectorId: 1 },
  { label: 'Sector 1', sectorId: 2 },
  { label: 'Sector 2', sectorId: 3 },
  { label: 'Sector 3', sectorId: 4 },
];

// -------------------------------------------------------------
// 2. SMALL SHARED PIECES
// -------------------------------------------------------------

function ReminderButton({
  subscribedEmail,
  onClick,
}: {
  subscribedEmail?: string;
  onClick: () => void;
}) {
  const isSubscribed = Boolean(subscribedEmail);
  return (
    <button
      type="button"
      onClick={onClick}
      title={isSubscribed ? `Active reminders for ${subscribedEmail}` : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
        isSubscribed
          ? 'bg-emerald-700 text-white hover:bg-emerald-800'
          : 'border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
      }`}
    >
      {isSubscribed ? <Check className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
      {isSubscribed ? 'Notified' : 'Notify me'}
    </button>
  );
}

// -------------------------------------------------------------
// 3. MAIN COMPONENT
// -------------------------------------------------------------

export default function ResidentSchedulesPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedLocationName, setSelectedLocationName] = useState<string>('Monte Claro');

  // Table filters
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedWasteType, setSelectedWasteType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Notification modal
  const [notifyGroup, setNotifyGroup] = useState<ScheduleGroup | null>(null);
  const [emailInput, setEmailInput] = useState<string>('');
  const [submittingNotification, setSubmittingNotification] = useState<boolean>(false);
  const [notificationFeedback, setNotificationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [subscribedScheduleIds, setSubscribedScheduleIds] = useState<Record<number, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) setSubscribedScheduleIds(JSON.parse(saved));
    } catch {
      // Storage unavailable
    }
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const schedRes = await getSchedules();
      setSchedules(schedRes.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load garbage collection timetable.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Real-time synchronization
  useRealtimeSync(() => loadData(true), { entity: 'schedules' });

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close the modal with Escape
  useEffect(() => {
    if (!notifyGroup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifyGroup(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notifyGroup]);

  const activeLocation = useMemo<SabangLocation | null>(() => {
    if (!selectedLocationName) return null;
    return SABANG_LOCATIONS.find((l) => l.name === selectedLocationName) || null;
  }, [selectedLocationName]);

  // Next pickup for the selected location (same rules as before)
  const next = useMemo(() => {
    if (!activeLocation) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    let daysUntil = 999;
    let targetDay = activeLocation.scheduleDays[0];

    for (const d of activeLocation.scheduleDays) {
      if (d === currentDay && currentHour < 10) {
        daysUntil = 0;
        targetDay = d;
        break;
      }
      let diff = d - currentDay;
      if (diff <= 0) diff += 7;
      if (diff < daysUntil) {
        daysUntil = diff;
        targetDay = d;
      }
    }

    let relativeLabel = `In ${daysUntil} days`;
    if (daysUntil === 0) relativeLabel = 'Today';
    else if (daysUntil === 1) relativeLabel = 'Tomorrow';

    return { dayName: SUN_FIRST_LONG[targetDay], relativeLabel, daysUntil };
  }, [activeLocation]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      if (activeLocation && !searchQuery) {
        const hasMatchingSectorInList = schedules.some((s) => s.area_id === activeLocation.sectorId);
        if (hasMatchingSectorInList) {
          const matchesSector = item.area_id === activeLocation.sectorId;
          const matchesNotes = item.notes?.toLowerCase().includes(activeLocation.name.toLowerCase());
          if (!matchesSector && !matchesNotes) return false;
        }
      }

      if (selectedDay && item.day_of_week !== selectedDay) return false;
      if (selectedWasteType && item.waste_type !== selectedWasteType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchArea = item.area_name?.toLowerCase().includes(q);
        const matchDay = DAY_LABELS[item.day_of_week]?.full.toLowerCase().includes(q);
        const matchWaste =
          item.waste_type?.toLowerCase().includes(q) ||
          WASTE_TYPE_CONFIG[item.waste_type]?.label.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchArea && !matchDay && !matchWaste && !matchNotes) return false;
      }

      return true;
    });
  }, [schedules, activeLocation, selectedDay, selectedWasteType, searchQuery]);

  // One row per day/time/sector, with every waste type collected that day listed together
  const allGroups = useMemo(() => groupSchedules(schedules), [schedules]);
  const filteredGroups = useMemo(() => groupSchedules(filteredSchedules), [filteredSchedules]);

  // The sector column only helps when the list spans more than one sector
  const showSectorColumn = useMemo(
    () => new Set(filteredGroups.map((g) => g.area_id ?? g.area_name ?? '')).size > 1,
    [filteredGroups]
  );

  const handleOpenNotify = (group: ScheduleGroup) => {
    setNotifyGroup(group);
    setEmailInput(user?.email || '');
    setNotificationFeedback(null);
  };

  const handleConfirmNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyGroup) return;

    const emailToUse = emailInput.trim() || user?.email || '';
    if (!emailToUse || !emailToUse.includes('@')) {
      setNotificationFeedback({ type: 'error', message: 'Please provide a valid recipient email address.' });
      return;
    }

    setSubmittingNotification(true);
    setNotificationFeedback(null);

    try {
      // One "Notify me" covers every waste type collected that day,
      // so each underlying schedule gets subscribed.
      const results = await Promise.allSettled(
        notifyGroup.items.map((item) => subscribeScheduleNotification(item.id, emailToUse))
      );

      const updated = { ...subscribedScheduleIds };
      let firstMessage: string | undefined;
      let firstError: unknown;
      let failed = 0;

      for (let i = 0; i < results.length; i += 1) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          updated[notifyGroup.items[i].id] = result.value.recipient_email;
          firstMessage = firstMessage ?? result.value.message;
        } else {
          failed += 1;
          firstError = firstError ?? result.reason;
        }
      }

      setSubscribedScheduleIds(updated);
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
      } catch {
        // Storage quota
      }

      if (failed === 0) {
        setNotificationFeedback({
          type: 'success',
          message:
            (notifyGroup.items.length === 1 ? firstMessage : undefined) ||
            `Subscribed! Reminders will be emailed to ${emailToUse}.`,
        });
        setTimeout(() => setNotifyGroup(null), 2500);
      } else {
        setNotificationFeedback({
          type: 'error',
          message:
            firstError instanceof Error
              ? firstError.message
              : 'Failed to register notification reminder.',
        });
      }
    } catch (err: unknown) {
      setNotificationFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to register notification reminder.',
      });
    } finally {
      setSubmittingNotification(false);
    }
  };

  const todayIdx = new Date().getDay();

  // Shared loading / empty state for the timetable (table and mobile list)
  const timetableStatus = loading ? (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-12 text-sm text-slate-500">
      <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
      Loading collection timetable...
    </div>
  ) : filteredSchedules.length === 0 ? (
    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center">
      <p className="text-sm font-semibold text-slate-700">No collection schedules found.</p>
      <p className="mt-1 text-xs text-slate-500">
        Try another location, or clear the search and filters above.
      </p>
    </div>
  ) : null;

  // A row counts as "Notified" only when every waste type in it is subscribed
  const groupSubscribedEmail = (group: ScheduleGroup) =>
    group.items.every((i) => subscribedScheduleIds[i.id])
      ? subscribedScheduleIds[group.items[0].id]
      : undefined;

  return (
    <div className="space-y-4">
      {/* ============ 1. HERO ============ */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b5d3f] via-[#0a6b48] to-[#0f5a52] p-4 text-white shadow-lg shadow-emerald-900/15 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-[#b6f23a]/10 blur-3xl" />

        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
          {/* Left: where, then when */}
          <div className="flex flex-col gap-4">
            {/* Location picker */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-xs">
                <label
                  htmlFor="location-selector"
                  className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-100/85"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#b6f23a]" />
                  Your street or subdivision
                </label>
                <div className="relative">
                  <select
                    id="location-selector"
                    value={selectedLocationName}
                    onChange={(e) => setSelectedLocationName(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-white/20 bg-white py-2.5 pl-3.5 pr-9 text-sm font-bold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b6f23a]"
                  >
                    <option value="">All Barangay Sabang (Full Overview)</option>
                    {GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {SABANG_LOCATIONS.filter((l) => l.sectorId === g.sectorId).map((l) => (
                          <option key={l.name} value={l.name}>
                            {l.name}
                            {l.sectorId === 1 ? ' (Daily)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
                </div>
              </div>
              {selectedLocationName && (
                <button
                  type="button"
                  onClick={() => setSelectedLocationName('')}
                  className="self-start rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Show all sectors
                </button>
              )}
            </div>

            {/* Next pickup */}
            <div className="border-t border-white/10 pt-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-100/80">
                <Calendar className="h-3.5 w-3.5 text-[#b6f23a]" />
                Next pickup
              </span>

              {activeLocation && next ? (
                <>
                  <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    {next.relativeLabel}
                    <span className="text-white/60"> · {next.dayName}</span>
                  </h1>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold ring-1 ring-white/15">
                      <Clock className="h-4 w-4 text-[#b6f23a]" />
                      {activeLocation.timeWindow}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
                      <MapPin className="h-4 w-4 text-[#b6f23a]" />
                      {activeLocation.name}, {formatSectorLabel(activeLocation.sectorName)}
                    </span>
                  </div>

                  {next.daysUntil <= 1 && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#b6f23a]">
                      <Truck className="h-4 w-4" />
                      Ilabas ang basura bago dumating ang trak.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    Barangay Sabang
                    <span className="text-white/60"> · All sectors</span>
                  </h1>
                  <p className="mt-2 text-sm text-emerald-50/90">
                    Pick your street or subdivision to see your exact pickup day. Trucks run {STD_WINDOW}.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right: pickup days this week */}
          <div className="flex flex-col justify-center rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-100/80">
              Pickup days this week
            </h2>

            <div className="grid grid-cols-7 gap-1.5">
              {SUN_FIRST_SHORT.map((d, i) => {
                const on = activeLocation?.scheduleDays.includes(i) ?? false;
                const isToday = i === todayIdx;
                return (
                  <div
                    key={d}
                    className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-center ${
                      on
                        ? `${LIME} border-transparent text-emerald-950`
                        : 'border-white/15 bg-white/10 text-white/70'
                    } ${isToday ? 'ring-2 ring-white' : ''}`}
                  >
                    <span className="text-xs font-bold">{d}</span>
                    {on ? (
                      <Truck className="h-4 w-4" />
                    ) : (
                      <span className="h-4 text-xs leading-4">·</span>
                    )}
                    <span className="sr-only">
                      {on ? 'pickup day' : 'no pickup'}
                      {isToday ? ', today' : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {activeLocation ? (
              <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/80">
                <li className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${LIME}`} aria-hidden="true" />
                  Pickup day
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm ring-2 ring-white" aria-hidden="true" />
                  Today
                </li>
              </ul>
            ) : (
              <p className="mt-3 text-xs text-emerald-100/80">
                Choose your street to highlight your pickup days.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ============ Errors ============ */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadData()}
            className="flex-shrink-0 rounded-full bg-rose-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============ 2. What to put out ============ */}
      <section aria-label="What to put out" className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-emerald-900">
              Biodegradable <span className="font-medium text-emerald-700">· Nabubulok</span>
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Food leftovers, vegetable peelings, fish bones, garden cuttings, dried leaves.
            </p>
            <p className="mt-2 text-xs font-bold text-emerald-800">
              Pickup days: {activeLocation ? activeLocation.bioDays : 'Per sector, see the timetable below'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">
              Non-biodegradable <span className="font-medium text-slate-600">· Di-nabubulok</span>
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Plastics, sachets, candy wrappers, disposable diapers, napkins, styrofoam.
            </p>
            <p className="mt-2 text-xs font-bold text-slate-800">
              Pickup days: {activeLocation ? activeLocation.nonBioDays : 'Per sector, see the timetable below'}
            </p>
          </div>
        </div>
      </section>

      {/* ============ 3. Timetables ============ */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              Official timetable · Ordinance No. 01-2022
            </span>
            <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900">
              Community waste collection timetables
            </h2>
          </div>

          <div
            className="flex self-start rounded-full bg-slate-100 p-1 sm:self-auto"
            role="tablist"
            aria-label="View mode"
          >
            {([
              { id: 'table', label: 'Timetable', Icon: TableIcon },
              { id: 'cards', label: 'By sector', Icon: LayoutGrid },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={viewMode === id}
                onClick={() => setViewMode(id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  viewMode === id ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTOR CARDS */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {SECTOR_CARDS.map((sec) => {
              const isSelected = activeLocation?.sectorId === sec.id;
              return (
                <div
                  key={sec.id}
                  className={`space-y-3 rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {sec.badge}
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-bold text-white">
                            Your sector
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-lg font-extrabold text-slate-900">{sec.title}</h3>
                    </div>
                    <span className="flex-shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">
                      {sec.timeWindow}
                    </span>
                  </div>

                  <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Clock className="h-4 w-4 text-emerald-700" />
                    {sec.scheduleSummary}
                  </p>

                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    {sec.rulesHighlight}
                  </p>

                  <div>
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Covered subdivisions &amp; sitios
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sec.subdivisions.map((subd) => {
                        const active = selectedLocationName === subd;
                        return (
                          <button
                            key={subd}
                            type="button"
                            onClick={() => {
                              setSelectedLocationName(subd);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            aria-pressed={active}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              active
                                ? 'bg-emerald-700 text-white'
                                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            {subd}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">Barangay Sabang Waste Logistics</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleGroup = allGroups.find((g) => g.area_id === sec.id) || allGroups[0];
                        if (sampleGroup) handleOpenNotify(sampleGroup);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Notify me
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TIMETABLE */}
        {viewMode === 'table' && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search day, sector or waste type"
                  aria-label="Search timetable"
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                aria-label="Filter by day"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">All days</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d].full}
                  </option>
                ))}
              </select>
              <select
                value={selectedWasteType}
                onChange={(e) => setSelectedWasteType(e.target.value)}
                aria-label="Filter by waste type"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="">All waste types</option>
                {(Object.keys(WASTE_TYPE_CONFIG) as WasteType[]).map((w) => (
                  <option key={w} value={w}>
                    {WASTE_TYPE_CONFIG[w].label}
                  </option>
                ))}
              </select>
            </div>

            {timetableStatus ?? (
              <>
                {!showSectorColumn && (
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-emerald-700" />
                    {formatSectorLabel(filteredGroups[0].area_name || 'All Barangay Sectors')}
                    {activeLocation && !searchQuery ? ` · ${activeLocation.name}` : ''}
                  </p>
                )}

                {/* Phones: one card per pickup day */}
                <ul className="space-y-2.5 md:hidden">
                  {filteredGroups.map((group) => {
                    const dayMeta = DAY_LABELS[group.day_of_week];
                    const subscribedEmail = groupSubscribedEmail(group);
                    return (
                      <li key={group.key} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${dayMeta.badgeBg}`}>
                            {dayMeta.full}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {fmtTime(group.start_time)} – {fmtTime(group.end_time)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((item) => (
                            <WasteChip key={item.id} type={item.waste_type} />
                          ))}
                        </div>
                        <div
                          className={`flex items-center gap-2 border-t border-slate-100 pt-3 ${
                            showSectorColumn ? 'justify-between' : 'justify-end'
                          }`}
                        >
                          {showSectorColumn && (
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-700" />
                              {formatSectorLabel(group.area_name || 'All Barangay Sectors')}
                            </span>
                          )}
                          <ReminderButton
                            subscribedEmail={subscribedEmail}
                            onClick={() => handleOpenNotify(group)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Tablet / desktop: one table row per pickup day */}
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <tr>
                          <th scope="col" className="px-4 py-3">Day &amp; time</th>
                          <th scope="col" className="px-4 py-3">Waste type</th>
                          {showSectorColumn && (
                            <th scope="col" className="px-4 py-3">Purok / sector</th>
                          )}
                          <th scope="col" className="px-4 py-3 text-center">Reminder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredGroups.map((group) => {
                          const dayMeta = DAY_LABELS[group.day_of_week];
                          const subscribedEmail = groupSubscribedEmail(group);
                          return (
                            <tr key={group.key} className="transition-colors hover:bg-emerald-50/40">
                              <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                                <div className="flex items-center gap-3">
                                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${dayMeta.badgeBg}`}>
                                    {dayMeta.full}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                    {fmtTime(group.start_time)} – {fmtTime(group.end_time)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 align-middle">
                                <div className="flex flex-wrap gap-1.5">
                                  {group.items.map((item) => (
                                    <WasteChip key={item.id} type={item.waste_type} />
                                  ))}
                                </div>
                              </td>
                              {showSectorColumn && (
                                <td className="px-4 py-3.5 align-middle">
                                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-700" />
                                    {formatSectorLabel(group.area_name || 'All Barangay Sectors')}
                                  </span>
                                </td>
                              )}
                              <td className="whitespace-nowrap px-4 py-3.5 text-center align-middle">
                                <ReminderButton
                                  subscribedEmail={subscribedEmail}
                                  onClick={() => handleOpenNotify(group)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ============ 4. Penalties (calm, compact) ============ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Ordinance No. 01-2022 &amp; RA 9003 penalties
          </h2>
          <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Epektibo: Ika-3 ng Pebrero 2025
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Ang paglalabas ng basura ay <strong className="text-slate-800">dapat magkahiwalay ang nabubulok at
          hindi nabubulok</strong>. Ang sinumang lalabag ay papatawan ng kaukulang parusa:
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { label: 'Unang Paglabag', fine: '₱500' },
            { label: 'Ikalawang Paglabag', fine: '₱750' },
            { label: 'Ikatlong Paglabag', fine: '₱1,000' },
          ].map((p) => (
            <div
              key={p.label}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 sm:block"
            >
              <span className="block text-xs font-semibold text-slate-600">{p.label}</span>
              <p className="text-base font-extrabold text-rose-700 sm:mt-0.5">
                {p.fine}
                <span className="ml-1.5 text-xs font-medium text-slate-500">+ Community Service</span>
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs font-bold uppercase tracking-wider text-emerald-800">
          &ldquo;Masigla, Maunlad at Maipagmamalaking Barangay Sabang&rdquo;
        </p>
      </section>

      {/* ============ 5. Notify modal ============ */}
      {notifyGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setNotifyGroup(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="notify-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <BellRing className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="notify-title" className="text-base font-extrabold text-slate-900">
                    Collection reminder
                  </h3>
                  <p className="text-xs font-medium text-slate-500">We&apos;ll email you before pickup</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifyGroup(null)}
                aria-label="Close"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <dl className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Day of week</dt>
                <dd className="text-right font-bold text-slate-800">
                  {DAY_LABELS[notifyGroup.day_of_week].full}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Time window</dt>
                <dd className="text-right font-bold text-slate-800">
                  {fmtTime(notifyGroup.start_time)} – {fmtTime(notifyGroup.end_time)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="pt-1 text-slate-500">Waste collected</dt>
                <dd className="flex flex-wrap justify-end gap-1.5">
                  {notifyGroup.items.map((item) => (
                    <WasteChip key={item.id} type={item.waste_type} />
                  ))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Purok / sector</dt>
                <dd className="text-right font-bold text-slate-800">
                  {formatSectorLabel(notifyGroup.area_name || 'All Barangay Sectors')}
                </dd>
              </div>
              {notifyGroup.notes.length > 0 && (
                <div className="mt-2 space-y-1.5 border-t border-slate-200 pt-2.5">
                  <span className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Pickup guidelines &amp; rules
                  </span>
                  {notifyGroup.notes.map((note) => (
                    <p
                      key={note}
                      className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-relaxed text-slate-700"
                    >
                      {note}
                    </p>
                  ))}
                </div>
              )}
            </dl>

            <form onSubmit={handleConfirmNotification} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="reminder-email-input"
                  className="flex items-center gap-1.5 text-sm font-bold text-slate-700"
                >
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                  Notification email address
                </label>
                <input
                  id="reminder-email-input"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="resident@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {notificationFeedback && (
                <div
                  role="status"
                  className={`rounded-xl border p-3 text-xs font-medium ${
                    notificationFeedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  {notificationFeedback.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setNotifyGroup(null)}
                  className="rounded-full px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotification}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submittingNotification ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Confirm &amp; notify me
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