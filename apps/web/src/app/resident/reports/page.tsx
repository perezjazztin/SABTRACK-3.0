'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { createReport, getMyReports } from '@/lib/api-client';
import { WasteReport, ReportCategory, ReportStatus } from '@/types/reports';

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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyReports();
      setReports(data.items);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load reports';
      setMessage({ type: 'error', text: errMessage });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const newReport = await createReport({
        category,
        title,
        description,
        location_text: locationText,
        photo_url: photoUrl.trim() || undefined,
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-civic-border">
        <div>
          <h1 className="text-2xl font-bold text-civic-slate">Community Waste Reports</h1>
          <p className="text-sm text-slate-500">
            Submit waste violations, uncollected garbage reports, and track their resolution by Barangay Sabang staff.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-civic-forest text-white rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-sm"
        >
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-1.5" /> Submit New Report</>}
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
          className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-civic-slate flex items-center">
              <FileText className="w-4 h-4 mr-2 text-civic-forest" />
              New Waste Incident Report
            </h2>
            <span className="text-xs text-slate-400">RA 10173 Protected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waste Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-civic-forest"
                required
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <option key={catKey} value={catKey}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location / Sitio / Landmark *
              </label>
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="e.g. Sitio Sampaguita, corner of Main Street"
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-civic-forest"
                required
                minLength={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Summary / Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Uncollected garbage bags piled on sidewalk"
              className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-civic-forest"
              required
              minLength={5}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what waste is present, how long it has been there, and any hazards..."
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-civic-forest"
              required
              minLength={10}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <Camera className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Optional Photo URL
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/waste-photo.jpg (Optional)"
              className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-civic-forest"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-5 py-2 bg-civic-forest text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-50 shadow-sm"
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
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center space-x-1.5 border ${
                isActive
                  ? 'bg-civic-forest text-white border-civic-forest shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{sKey.replace('_', ' ')}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
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
        <div className="p-12 text-center text-sm text-slate-400 bg-white rounded-2xl border border-civic-border">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-civic-forest" />
          Loading your submitted reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <FileText className="w-8 h-8 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === 'ALL'
              ? "You haven't submitted any waste reports yet. Click 'Submit New Report' above to report an issue."
              : `No reports currently match status '${filterStatus}'.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const statusMeta = STATUS_CONFIG[report.status];
            const StatusIcon = statusMeta.icon;
            const isExpanded = expandedReportId === report.id;

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-civic-border shadow-sm overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {CATEGORY_LABELS[report.category] || report.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Report #{report.id} &bull; {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-civic-slate mt-1">
                        {report.title}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                      {statusMeta.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {report.location_text}
                    </span>
                    {report.admin_notes && (
                      <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
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
                      className="text-xs font-semibold text-civic-forest hover:text-emerald-900 inline-flex items-center transition-colors"
                    >
                      {isExpanded ? (
                        <>Hide Status History <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
                      ) : (
                        <>View Status History ({report.status_history?.length || 1}) <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
                      )}
                    </button>
                    {report.photo_url && (
                      <a
                        href={report.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" /> View Photo
                      </a>
                    )}
                  </div>
                </div>

                {/* Immutable Status Timeline Drawer */}
                {isExpanded && (
                  <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Immutable Status Transition History
                    </h4>
                    <div className="space-y-3 border-l-2 border-slate-200 ml-2 pl-4">
                      {report.status_history?.map((h, idx) => (
                        <div key={h.id || idx} className="relative text-xs space-y-0.5">
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
                            <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
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
