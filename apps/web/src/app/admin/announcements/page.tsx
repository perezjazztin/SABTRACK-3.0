'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  RefreshCw,
  Calendar,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  FileText,
  X,
  User,
  Clock,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '@/lib/api-client';
import {
  AnnouncementItem,
  AnnouncementCategory,
  AnnouncementCreatePayload,
} from '@/types/announcements';

const CATEGORIES: { value: AnnouncementCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General Advisory' },
  { value: 'CLEANUP_DRIVE', label: 'Community Clean-Up Drive' },
  { value: 'HOLIDAY_SCHEDULE', label: 'Holiday Collection Shift' },
  { value: 'EMERGENCY', label: 'Urgent Public Emergency' },
  { value: 'POLICY_UPDATE', label: 'RA 9003 Policy / Ordinance' },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & form state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AnnouncementCreatePayload>({
    title: '',
    content: '',
    category: 'GENERAL',
    is_pinned: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnnouncements();
      setAnnouncements(res.items);
    } catch (err) {
      setError('Failed to fetch announcements.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAnnouncement(form);
      setShowModal(false);
      setForm({
        title: '',
        content: '',
        category: 'GENERAL',
        is_pinned: false,
      });
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to deactivate announcement.');
    }
  };

  return (
    <ProtectedRoute
      requiredPermission="announcements:manage"
      moduleName="Official Announcements & Bulletin Publisher"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-7 h-7 text-emerald-700" />
              Announcements &amp; Bulletins Publisher
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Publish official waste advisories, environmental notices, and holiday collection changes.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Compose Notice
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

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Announcements Directory Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">
              Published Bulletins ({announcements.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Headline</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Date Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No announcements published yet. Click "Compose Notice" to create one.
                    </td>
                  </tr>
                ) : (
                  announcements.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-sm">
                        <div className="flex items-center gap-1.5">
                          {item.is_pinned && (
                            <Pin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.is_pinned ? (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Pinned
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Standard</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.author_name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Deactivate notice"
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

        {/* Modal: Compose Announcement */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Compose Official Barangay Notice
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Announcement Headline
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Barangay Sabang Clean-Up Drive this Saturday"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Advisory Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as AnnouncementCategory,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 focus:bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Full Content &amp; Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Provide full details, meeting location, guidelines, and schedules for residents..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={form.is_pinned}
                    onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600"
                  />
                  <label htmlFor="is_pinned" className="text-slate-700 font-medium">
                    Pin this announcement to top of Resident bulletin
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Publishing...' : 'Publish Notice'}
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
