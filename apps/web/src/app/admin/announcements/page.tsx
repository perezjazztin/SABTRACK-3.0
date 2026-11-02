'use client';

import { useRealtimeSync } from '@/lib/use-realtime-sync';

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
  CheckCircle2,
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
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  // Automatic real-time background synchronization
  useRealtimeSync(loadData, { entity: 'announcements' });

  const handleOpenModal = () => {
    setModalError(null);
    setForm({
      title: '',
      content: '',
      category: 'GENERAL',
      is_pinned: false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError(null);
  };

  // Handle Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const cleanTitle = form.title.trim();
    const cleanContent = form.content.trim();

    if (cleanTitle.length < 5) {
      setModalError('Announcement headline must be at least 5 characters long.');
      return;
    }
    if (cleanContent.length < 10) {
      setModalError('Full content & instructions must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await createAnnouncement({
        ...form,
        title: cleanTitle,
        content: cleanContent,
      });
      setShowModal(false);
      setForm({
        title: '',
        content: '',
        category: 'GENERAL',
        is_pinned: false,
      });
      setSuccessMessage('Official notice published successfully to community bulletins.');
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Failed to publish announcement.';
      setModalError(errorMsg);
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
      <div className="space-y-8">
        {/* Header */}
        <div className="neu-card rounded-3xl border border-slate-200/70 p-7 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                Civic Communications
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">Barangay Sabang Council</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <Megaphone className="w-7 h-7 text-emerald-700" />
              Announcements &amp; Bulletins Publisher
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Publish official waste advisories, environmental notices, and holiday collection changes to community residents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-civic-forest hover:bg-civic-forestHover rounded-xl transition-all shadow-neu-green"
            >
              <Plus className="w-4 h-4" />
              Compose Notice
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="neu-button p-2.5 text-slate-600 rounded-xl transition-all shadow-neu-raised"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Success Feedback */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs shadow-neu-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 text-base leading-none"
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs shadow-neu-xs">
            {error}
          </div>
        )}

        {/* Announcements Directory Table */}
        <div className="neu-card border border-slate-200/70 rounded-3xl shadow-neu-raised overflow-hidden">
          <div className="px-6 py-4.5 border-b border-slate-200/70 bg-emerald-50/40 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">
              Published Bulletins ({announcements.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80 shadow-neu-xs">
                <tr>
                  <th className="px-5 py-4">Headline</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Author</th>
                  <th className="px-5 py-4">Date Published</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {announcements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto space-y-3">
                        <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-slate-600 font-medium">
                          No announcements published yet. Click &ldquo;Compose Notice&rdquo; to create one.
                        </p>
                        <button
                          onClick={handleOpenModal}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-civic-forest hover:bg-civic-forestHover rounded-xl shadow-neu-green transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Compose First Notice
                        </button>
                      </div>
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
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="neu-modal rounded-3xl border border-slate-200/70 max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-neu-raised my-auto max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-civic-forest border border-emerald-200">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Compose Official Barangay Notice
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Dispatches to Barangay Sabang resident dashboards &amp; bulletins
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close compose modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Inline Modal Error */}
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 shadow-neu-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{modalError}</div>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4 text-xs overflow-y-auto pr-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Announcement Headline <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] ${form.title.trim().length >= 5 ? 'text-slate-400' : 'text-amber-600 font-medium'}`}>
                      {form.title.trim().length}/200 {form.title.trim().length < 5 ? '(min. 5 chars)' : ''}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      if (modalError) setModalError(null);
                    }}
                    placeholder="e.g. Barangay Sabang Clean-Up Drive this Saturday"
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-forest"
                    minLength={5}
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Advisory Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as AnnouncementCategory,
                      })
                    }
                    className="neu-select w-full px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Full Content &amp; Instructions <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] ${form.content.trim().length >= 10 ? 'text-slate-400' : 'text-amber-600 font-medium'}`}>
                      {form.content.trim().length}/5000 {form.content.trim().length < 10 ? '(min. 10 chars)' : ''}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={form.content}
                    onChange={(e) => {
                      setForm({ ...form, content: e.target.value });
                      if (modalError) setModalError(null);
                    }}
                    placeholder="Provide full details, meeting location, guidelines, and schedules for residents..."
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-forest"
                    minLength={10}
                    maxLength={5000}
                    required
                  />
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    checked={form.is_pinned}
                    onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                    className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="is_pinned" className="text-slate-700 font-medium cursor-pointer">
                    Pin this announcement to top of Resident bulletin
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="neu-button px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-civic-forest hover:bg-civic-forestHover rounded-xl shadow-neu-green transition-all disabled:opacity-50"
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
