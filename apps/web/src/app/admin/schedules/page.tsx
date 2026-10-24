'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError('Failed to fetch schedule data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [schedForm.area_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      requiredPermission="schedules:manage"
      moduleName="Collection Schedule Administration"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-emerald-700" />
              Collection Schedule Administration
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Configure weekly pickup timetables by purok and broadcast emergency route change advisories.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowAdvisoryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-amber-900 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shadow-sm"
            >
              <Radio className="w-4 h-4 text-amber-700" />
              Broadcast Advisory
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Collection Slot
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

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
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">
              Weekly Timetable Directory ({schedules.length} entries)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Purok / Sector</th>
                  <th className="px-4 py-3">Day of Week</th>
                  <th className="px-4 py-3">Waste Category</th>
                  <th className="px-4 py-3">Collection Hours</th>
                  <th className="px-4 py-3">Guidance / Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No active schedules found. Click "Add Collection Slot" to create one.
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
                        <button
                          onClick={() => handleDeleteSchedule(item.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Deactivate schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Collection Slot */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
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
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white"
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
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white"
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
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white"
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
                      className="w-full px-3 py-2 border rounded-lg"
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
                      className="w-full px-3 py-2 border rounded-lg"
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
                    className="w-full px-3 py-2 border rounded-lg"
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
        {showAdvisoryModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
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
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white"
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
                    className="w-full px-3 py-2 border rounded-lg"
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
                      className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white"
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
                      className="w-full px-3 py-2 border rounded-lg"
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
                    className="w-full px-3 py-2 border rounded-lg"
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
