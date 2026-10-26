'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeSync } from '@/lib/use-realtime-sync';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Plus,
  Send,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { createReport, getMyReports, resolveImageUrl } from '@/lib/api-client';
import { WasteReport, ReportCategory, ReportStatus } from '@/types/reports';
import { ImageUpload } from '@/components/ImageUpload';

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  UNCOLLECTED_GARBAGE: 'Uncollected Garbage',
  ILLEGAL_DUMPING: 'Illegal Dumping',
  IMPROPER_SEGREGATION: 'Improper Segregation',
  HAZARDOUS_WASTE: 'Hazardous Waste',
  OVERFLOWING_BIN: 'Overflowing Bin',
  OTHER: 'Other Concern',
};

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  SUBMITTED: {
    label: 'Submitted',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: AlertCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: RefreshCw,
  },
  RESOLVED: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    icon: ShieldAlert,
  },
};

export default function ResidentReportsPage() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [category, setCategory] = useState<ReportCategory>('UNCOLLECTED_GARBAGE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getMyReports();
      setReports(data.items);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load reports';
      if (!silent) setMessage({ type: 'error', text: errMessage });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Automatic real-time background synchronization (< 3s SLA)
  useRealtimeSync(() => fetchReports(true), { entity: 'reports' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Enforce required evidence photo attachment
    if (!photoUrl || !photoUrl.trim()) {
      setMessage({
        type: 'error',
        text: 'Kinakailangan ang larawan bilang patunay ng insidente (Evidence photo is required to submit a report).',
      });
      return;
    }

    setSubmitting(true);

    try {
      const newReport = await createReport({
        category,
        title,
        description,
        location_text: locationText,
        photo_url: photoUrl.trim(),
      });

      setReports((prev) => [newReport, ...prev]);
      setMessage({
        type: 'success',
        text: 'Your report was successfully submitted to Barangay Sabang officials!',
      });
      // Reset form
      setTitle('');
      setDescription('');
      setLocationText('');
      setPhotoUrl('');
      setShowForm(false);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Submission failed';
      setMessage({ type: 'error', text: errMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="neu-card rounded-3xl border border-slate-200/70 p-7 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
              Barangay Sabang Resident Services
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">RA 9003 &bull; RA 10173</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-civic-slate tracking-tight">Community Waste Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Submit waste violations, uncollected garbage reports, and track their resolution by Barangay Sabang staff in real-time.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-5 py-3 bg-civic-forest text-white rounded-xl text-xs font-bold shadow-neu-green hover:bg-civic-forestHover transition-all flex-shrink-0"
        >
          {showForm ? 'Cancel Submission' : <><Plus className="w-4 h-4 mr-2" /> Submit New Report</>}
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm border flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="neu-card rounded-3xl border border-slate-200/70 p-7 sm:p-9 shadow-neu-raised space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
            <h2 className="text-base font-bold text-civic-slate flex items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-civic-forest mr-2.5">
                <FileText className="w-4 h-4" />
              </div>
              New Waste Incident Report
            </h2>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-semibold">
              RA 10173 Protected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Waste Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full text-sm neu-input rounded-xl px-4 py-2.5 bg-white text-slate-800 focus:outline-none"
                required
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <option key={catKey} value={catKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Location / Sitio / Landmark *
              </label>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. Sitio Sampaguita, corner of Main Street"
                className="w-full text-sm neu-input rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none placeholder:text-slate-400"
                required
                minLength={3}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Report Summary / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Uncollected garbage bags piled on sidewalk"
              className="w-full text-sm neu-input rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none placeholder:text-slate-400"
              required
              minLength={5}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what waste is present, how long it has been there, and any hazards..."
              rows={3}
              className="w-full text-sm neu-input rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none placeholder:text-slate-400 resize-none"
              required
              minLength={10}
            />
          </div>

          {/* Mandatory Photo Evidence Upload */}
          <div className="space-y-1.5">
            <ImageUpload
              value={photoUrl}
              onChange={(url) => {
                setPhotoUrl(url);
                if (url && message?.type === 'error') {
                  setMessage(null);
                }
              }}
              label="Incident Photo Evidence *"
              helperText="Upload or take a photo of the waste or violation (JPEG, PNG, WebP up to 5MB). Photo attachment is required for verification."
            />
            {!photoUrl && (
              <p className="text-[11px] text-amber-700 font-medium">
                * Paalala: Kinakailangan ang larawan bilang patunay ng insidente bago ma-submit ang report.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4.5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !photoUrl.trim()}
              className="inline-flex items-center px-6 py-2.5 bg-civic-forest text-white rounded-xl text-xs font-bold shadow-neu-green hover:bg-civic-forestHover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="neu-card p-2 rounded-2xl border border-slate-200/70 shadow-neu-xs flex items-center space-x-2 overflow-x-auto text-xs">
        {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED'].map((sKey) => {
          const count =
            sKey === 'ALL'
              ? reports.length
              : reports.filter((r) => r.status === sKey).length;
          const isActive = filterStatus === sKey;

          return (
            <button
              key={sKey}
              onClick={() => setFilterStatus(sKey)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-civic-forest text-white shadow-neu-green'
                  : 'text-slate-600 hover:text-civic-forest hover:bg-emerald-50/70'
              }`}
            >
              <span>{sKey.replace('_', ' ')}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="neu-card p-14 text-center text-sm text-slate-400 rounded-3xl border border-slate-200/70 shadow-neu-raised">
          <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-civic-forest" />
          Loading your submitted reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="neu-card p-14 text-center rounded-3xl border border-slate-200/70 shadow-neu-raised space-y-3.5">
          <div className="neu-socket w-14 h-14 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {filterStatus === 'ALL'
              ? "You haven't submitted any waste reports yet. Click 'Submit New Report' above to report an issue."
              : `No reports currently match status '${filterStatus}'.`}
          </p>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {filteredReports.map((report) => {
            const statusMeta = STATUS_CONFIG[report.status];
            const StatusIcon = statusMeta.icon;
            const isExpanded = expandedReportId === report.id;

            return (
              <div
                key={report.id}
                className="neu-card rounded-3xl border border-slate-200/70 shadow-neu-raised overflow-hidden"
              >
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-civic-forest border border-emerald-100">
                          {CATEGORY_LABELS[report.category] || report.category}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Report #{report.id} &bull; {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-civic-slate">
                        {report.title}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                      {statusMeta.label}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Photo Evidence Preview if present */}
                  {report.photo_url && (
                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href={resolveImageUrl(report.photo_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50 p-1.5 pr-3 hover:bg-emerald-50/50 transition-colors"
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveImageUrl(report.photo_url)}
                            alt={`Photo evidence for report #${report.id}`}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            crossOrigin="use-credentials"
                          />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center text-xs font-bold text-slate-700 group-hover:text-civic-forest">
                            <Camera className="w-3.5 h-3.5 mr-1 text-slate-400 group-hover:text-civic-forest" />
                            View Attached Evidence Photo
                          </div>
                          <span className="text-[10px] text-slate-400">RA 10173 Sanitized &bull; Click to open</span>
                        </div>
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-200/70">
                    <span className="inline-flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {report.location_text}
                    </span>
                    {report.admin_notes && (
                      <span className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg text-[11px] border border-emerald-200 font-medium">
                        Official Note: {report.admin_notes}
                      </span>
                    )}
                  </div>

                  {/* Toggle Timeline */}
                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() =>
                        setExpandedReportId(isExpanded ? null : report.id)
                      }
                      className="text-xs font-bold text-civic-forest hover:text-emerald-900 inline-flex items-center transition-colors"
                    >
                      {isExpanded ? (
                        <>Hide Status History <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
                      ) : (
                        <>View Status History ({report.status_history?.length || 1}) <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
                      )}
                    </button>
                    {report.photo_url && (
                      <a
                        href={resolveImageUrl(report.photo_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" /> View Full Photo
                      </a>
                    )}
                  </div>
                </div>

                {/* Immutable Status Timeline Drawer */}
                {isExpanded && (
                  <div className="bg-[#e9eff5] border-t border-slate-200/70 p-6 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Immutable Status Transition History
                    </h4>
                    <div className="space-y-3 border-l-2 border-emerald-600/30 ml-2 pl-4">
                      {report.status_history?.map((h, idx) => (
                        <div key={h.id || idx} className="relative text-xs space-y-1">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-civic-forest border-2 border-white" />
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800">
                              {h.new_status}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              by {h.changed_by_name} ({h.changed_by_role})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              &bull; {new Date(h.created_at).toLocaleString()}
                            </span>
                          </div>
                          {h.remarks && (
                            <p className="text-slate-600 neu-socket p-2.5 rounded-xl border border-slate-200/70 mt-1 shadow-neu-xs">
                              &ldquo;{h.remarks}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
