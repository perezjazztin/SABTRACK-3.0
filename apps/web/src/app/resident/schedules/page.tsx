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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  getSchedules,
  getAdvisories,
  getScheduleAreas,
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

const DAY_LABELS: Record<DayOfWeek, { short: string; full: string }> = {
  MONDAY: { short: 'Mon', full: 'Monday' },
  TUESDAY: { short: 'Tue', full: 'Tuesday' },
  WEDNESDAY: { short: 'Wed', full: 'Wednesday' },
  THURSDAY: { short: 'Thu', full: 'Thursday' },
  FRIDAY: { short: 'Fri', full: 'Friday' },
  SATURDAY: { short: 'Sat', full: 'Saturday' },
  SUNDAY: { short: 'Sun', full: 'Sunday' },
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

export default function ResidentSchedulesPage() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(
    user?.area_id || null
  );
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Group schedules by day of week
  const schedulesByDay = DAYS_OF_WEEK.reduce<Record<DayOfWeek, ScheduleItem[]>>(
    (acc, day) => {
      acc[day] = schedules.filter((s) => s.day_of_week === day);
      return acc;
    },
    {} as Record<DayOfWeek, ScheduleItem[]>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-emerald-700" />
            Garbage Collection Schedules
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Official pickup timetables and waste segregation guide for Barangay Sabang.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadScheduleData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Area / Purok Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>Filter by Purok / Zone:</span>
        </div>
        <div className="w-full sm:w-72">
          <select
            value={selectedAreaId || ''}
            onChange={(e) =>
              setSelectedAreaId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          >
            <option value="">All Barangay Areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
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

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const daySchedules = schedulesByDay[day];
          const hasCollection = daySchedules.length > 0;

          return (
            <div
              key={day}
              className={`border rounded-xl shadow-sm bg-white overflow-hidden flex flex-col ${
                hasCollection ? 'border-slate-200' : 'border-slate-100 opacity-75'
              }`}
            >
              {/* Day Header */}
              <div
                className={`px-4 py-3 flex items-center justify-between border-b ${
                  hasCollection
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    {DAY_LABELS[day].full}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    hasCollection
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {hasCollection ? `${daySchedules.length} Pickup` : 'No Pickup'}
                </span>
              </div>

              {/* Day Content */}
              <div className="p-3.5 space-y-3 flex-1">
                {hasCollection ? (
                  daySchedules.map((item) => {
                    const config = WASTE_TYPE_CONFIG[item.waste_type];
                    const IconComponent = config.icon;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg bg-slate-50 border ${config.borderClass} space-y-2 text-xs`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${config.badgeClass}`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
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
                          <p className="text-[11px] text-slate-500 italic border-t border-slate-200/60 pt-1.5">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center py-6 text-slate-400 text-xs text-center">
                    No scheduled collection for this day.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Segregation Rules Reference Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-emerald-700" />
          Barangay Sabang Waste Segregation Guidelines
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3 rounded-lg border border-emerald-200">
            <span className="font-semibold text-emerald-800 block mb-1">
              🌱 Biodegradable (Green Bag)
            </span>
            <p className="text-slate-600">
              Kitchen scraps, vegetable peelings, leftover food, dry leaves, garden cuttings.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">
              🗑️ Non-Biodegradable (Black Bag)
            </span>
            <p className="text-slate-600">
              Sanitary napkins, disposable diapers, styrofoam, contaminated wrappers, soiled plastic.
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <span className="font-semibold text-blue-800 block mb-1">
              ♻️ Recyclable (White/Clear Bag)
            </span>
            <p className="text-slate-600">
              Clean PET bottles, clean cardboard, tin cans, dry paper, glass bottles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
