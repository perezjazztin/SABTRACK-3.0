'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeSync } from '@/lib/use-realtime-sync';
import {
  CalendarDays,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Send,
  Radio,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  getSchedules,
  createSchedule,
  deleteSchedule,
  getAdvisories,
  createAdvisory,
  getScheduleAreas,
  AreaItem,
} from '@/lib/api-client';
import {
  ScheduleItem,
  AdvisoryItem,
  DayOfWeek,
  WasteType,
  AdvisoryType,
  ScheduleCreatePayload,
  AdvisoryCreatePayload,
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

const WASTE_TYPES: WasteType[] = [
  'BIODEGRADABLE',
  'NON_BIODEGRADABLE',
  'RECYCLABLE',
  'SPECIAL_HAZARDOUS',
];

export default function AdminSchedulesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'BARANGAY_ADMIN';
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Schedule form
  const [schedForm, setSchedForm] = useState<ScheduleCreatePayload>({
    area_id: 1,
    day_of_week: 'MONDAY',
    waste_type: 'BIODEGRADABLE',
    start_time: '06:00 AM',
    end_time: '09:00 AM',
    notes: '',
  });

  // New Advisory form
  const [advForm, setAdvForm] = useState<AdvisoryCreatePayload>({
    area_id: null,
    title: '',
    message: '',
    advisory_type: 'DELAY',
    effective_date: '',
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const [schedRes, advRes, areaList] = await Promise.all([
        getSchedules(),
        getAdvisories(),
        getScheduleAreas(),
      ]);
      setSchedules(schedRes.items);
      setAdvisories(advRes.items);
      setAreas(areaList);
      if (areaList.length > 0 && !schedForm.area_id) {
        setSchedForm((prev) => ({ ...prev, area_id: areaList[0].id }));
      }
    } catch (err) {
      if (!silent) setError('Failed to fetch schedule data.');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [schedForm.area_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatic real-time background synchronization (< 3s SLA)
  useRealtimeSync(() => loadData(true), { entity: 'schedules' });

  // Handle Create Schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createSchedule(schedForm);
      setShowScheduleModal(false);
      setSchedForm({
        area_id: areas[0]?.id || 1,
        day_of_week: 'MONDAY',
        waste_type: 'BIODEGRADABLE',
        start_time: '06:00 AM',
        end_time: '09:00 AM',
        notes: '',
      });
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to create schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deactivate Schedule
  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this collection schedule?')) return;
    try {
      await deleteSchedule(id);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to deactivate schedule.');
    }
  };

  // Handle Create Advisory
  const handleCreateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAdvisory(advForm);
      setShowAdvisoryModal(false);
      setAdvForm({
        area_id: null,
        title: '',
        message: '',
        advisory_type: 'DELAY',
        effective_date: '',
      });
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to broadcast advisory.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute
      requiredRole={['BARANGAY_STAFF', 'BARANGAY_ADMIN']}
      moduleName="Collection Schedules"
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                Logistics &amp; Routing
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">
                {isAdmin ? 'Barangay Admin Authorization' : 'Staff View-Only Access'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <CalendarDays className="w-7 h-7 text-emerald-700" />
              Collection Schedule Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {isAdmin
                ? 'Configure weekly pickup timetables by purok and broadcast emergency route change advisories to residents.'
                : 'Operational directory of weekly pickup timetables by purok and active emergency route change advisories.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowAdvisoryModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 rounded-xl transition-all shadow-neu-xs"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-700" />
                  Broadcast Advisory
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-white bg-civic-forest hover:bg-civic-forestHover rounded-xl transition-all shadow-neu-green"
                >
                  <Plus className="w-4 h-4" />
                  Add Collection Slot
                </button>
              </>
            )}
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="neu-button p-2.5 text-slate-600 rounded-xl transition-all shadow-neu-raised"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Staff View-Only Banner */}
        {!isAdmin && (
          <div className="flex items-center gap-3 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-blue-900 text-xs shadow-neu-xs">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Staff View-Only Access Mode</p>
              <p className="text-blue-700/90 text-[11px] mt-0.5">
                You are viewing the operational collection timetable and route advisories. Adding new collection slots, broadcasting alerts, or deactivating entries requires Barangay Administrator authorization.
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-semibold border border-blue-200">
              Read-Only
            </span>
          </div>
        )}

        {/* Active Delay Advisories */}
        {advisories.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Active Broadcast Advisories ({advisories.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {advisories.map((advisory) => (
                <div
                  key={advisory.id}
                  className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{advisory.title}</span>
                    <span className="bg-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                      {advisory.advisory_type}
                    </span>
                  </div>
                  <p className="mt-1 text-amber-800 leading-normal">{advisory.message}</p>
                  <div className="mt-2 text-[11px] text-amber-700 flex justify-between">
                    <span>Target: {advisory.area_name || 'All Barangay'}</span>
                    <span>Effective: {advisory.effective_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Schedules Management Table */}
        <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
          <div className="px-6 py-4 border-b border-white/80 bg-[#e4ecf3] flex items-center justify-between shadow-neu-xs">
            <h2 className="font-black text-slate-800 text-xs uppercase tracking-wider">
              Weekly Timetable Directory ({schedules.length} entries)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80 shadow-neu-xs">
                <tr>
                  <th className="px-5 py-4">Purok / Sector</th>
                  <th className="px-5 py-4">Day of Week</th>
                  <th className="px-5 py-4">Waste Category</th>
                  <th className="px-5 py-4">Collection Hours</th>
                  <th className="px-5 py-4">Guidance / Notes</th>
                  <th className="px-5 py-4 text-right">{isAdmin ? "Actions" : "Access"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-[#edf2f7]/50">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {isAdmin ? "No active schedules found. Click \"Add Collection Slot\" to create one." : "No active schedules currently published."}
                    </td>
                  </tr>
                ) : (
                  schedules.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.area_name || 'All Sectors'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {item.day_of_week}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            item.waste_type === 'BIODEGRADABLE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.waste_type === 'NON_BIODEGRADABLE'
                              ? 'bg-slate-100 text-slate-800 border-slate-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {item.waste_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.start_time} - {item.end_time}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {item.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin ? (
                          <button
                            onClick={() => handleDeleteSchedule(item.id)}
                            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Deactivate schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Collection Slot */}
        {isAdmin && showScheduleModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="neu-modal rounded-3xl border border-emerald-900/10 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-neu-raised">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Add Collection Schedule Slot
                </h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Barangay Purok / Sector
                  </label>
                  <select
                    value={schedForm.area_id}
                    onChange={(e) =>
                      setSchedForm({ ...schedForm, area_id: Number(e.target.value) })
                    }
                    className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                    required
                  >
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Day of Week
                    </label>
                    <select
                      value={schedForm.day_of_week}
                      onChange={(e) =>
                        setSchedForm({
                          ...schedForm,
                          day_of_week: e.target.value as DayOfWeek,
                        })
                      }
                      className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                      required
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Waste Type
                    </label>
                    <select
                      value={schedForm.waste_type}
                      onChange={(e) =>
                        setSchedForm({
                          ...schedForm,
                          waste_type: e.target.value as WasteType,
                        })
                      }
                      className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                      required
                    >
                      {WASTE_TYPES.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      value={schedForm.start_time}
                      onChange={(e) =>
                        setSchedForm({ ...schedForm, start_time: e.target.value })
                      }
                      placeholder="06:00 AM"
                      className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      value={schedForm.end_time}
                      onChange={(e) =>
                        setSchedForm({ ...schedForm, end_time: e.target.value })
                      }
                      placeholder="09:00 AM"
                      className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Pickup Guidance / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={schedForm.notes || ''}
                    onChange={(e) =>
                      setSchedForm({ ...schedForm, notes: e.target.value })
                    }
                    placeholder="e.g. Curbside pickup only; green bags required"
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Broadcast Advisory */}
        {isAdmin && showAdvisoryModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="neu-modal rounded-3xl border border-emerald-900/10 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-neu-raised">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Broadcast Collection Advisory
                </h3>
                <button
                  onClick={() => setShowAdvisoryModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdvisory} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Target Sector
                  </label>
                  <select
                    value={advForm.area_id || ''}
                    onChange={(e) =>
                      setAdvForm({
                        ...advForm,
                        area_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  >
                    <option value="">All Barangay Sabang (Barangay-wide)</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Advisory Title
                  </label>
                  <input
                    type="text"
                    value={advForm.title}
                    onChange={(e) =>
                      setAdvForm({ ...advForm, title: e.target.value })
                    }
                    placeholder="e.g. Truck 2 Mechanical Delay"
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Advisory Type
                    </label>
                    <select
                      value={advForm.advisory_type}
                      onChange={(e) =>
                        setAdvForm({
                          ...advForm,
                          advisory_type: e.target.value as AdvisoryType,
                        })
                      }
                      className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                    >
                      <option value="DELAY">Collection Delay</option>
                      <option value="ROUTE_CHANGE">Route Modification</option>
                      <option value="SPECIAL_COLLECTION">Special Cleanup Drive</option>
                      <option value="HOLIDAY_SUSPENSION">Holiday Suspension</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Effective Date
                    </label>
                    <input
                      type="text"
                      value={advForm.effective_date}
                      onChange={(e) =>
                        setAdvForm({ ...advForm, effective_date: e.target.value })
                      }
                      placeholder="e.g. October 26, 2026"
                      className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Detailed Message
                  </label>
                  <textarea
                    rows={3}
                    value={advForm.message}
                    onChange={(e) =>
                      setAdvForm({ ...advForm, message: e.target.value })
                    }
                    placeholder="Explain the reason for delay and expected arrival window..."
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAdvisoryModal(false)}
                    className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-white bg-amber-700 hover:bg-amber-800 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Broadcasting...' : 'Broadcast Notice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
