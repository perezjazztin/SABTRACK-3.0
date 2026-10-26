'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeSync } from '@/lib/use-realtime-sync';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  User,
  SlidersHorizontal,
  X,
  Camera,
} from 'lucide-react';
import { getAllReports, updateReportStatus, resolveImageUrl } from '@/lib/api-client';
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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Status Update Modal State
  const [editingReport, setEditingReport] = useState<WasteReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>('UNDER_REVIEW');
  const [remarks, setRemarks] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAllReports({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      });
      setReports(data.items);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      if (!silent) setMessage({ type: 'error', text: errMessage });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedStatus, selectedCategory]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Automatic real-time background synchronization (< 3s SLA)
  useRealtimeSync(() => fetchReports(true), { entity: 'reports' });

  const openUpdateModal = (report: WasteReport) => {
    setEditingReport(report);
    setNewStatus(report.status === 'SUBMITTED' ? 'UNDER_REVIEW' : report.status);
    setRemarks('');
    setAdminNotes(report.admin_notes || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    setUpdating(true);
    setMessage(null);

    try {
      const updated = await updateReportStatus(editingReport.id, {
        status: newStatus,
        remarks: remarks.trim() || undefined,
        admin_notes: adminNotes.trim() || undefined,
      });

      // Update in state
      setReports((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
      setMessage({
        type: 'success',
        text: `Report #${updated.id} status updated to ${updated.status}. Immutable history entry recorded.`,
      });
      setEditingReport(null);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Failed to update report';
      setMessage({ type: 'error', text: errMessage });
    } finally {
      setUpdating(false);
    }
  };

  // KPI calculations
  const totalCount = reports.length;
  const submittedCount = reports.filter((r) => r.status === 'SUBMITTED').length;
  const reviewCount = reports.filter((r) => r.status === 'UNDER_REVIEW').length;
  const inProgressCount = reports.filter((r) => r.status === 'IN_PROGRESS').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="neu-card rounded-3xl border border-slate-200/70 p-7 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
              Barangay Operations Command
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Incident Review &amp; Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-civic-slate tracking-tight">
            Barangay Waste Incident Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Review submitted citizen waste complaints, dispatch field personnel, and manage resolution records with immutable audit tracking.
          </p>
        </div>
        <button
          onClick={() => fetchReports()}
          className="neu-button inline-flex items-center px-4 py-2.5 text-slate-700 rounded-xl text-xs font-bold shadow-neu-raised transition-all flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Queue
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4.5 rounded-2xl text-sm border flex items-center justify-between shadow-neu-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span className="font-medium">{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-5">
        <div className="neu-card p-5 rounded-2xl border border-slate-200/70 shadow-neu-raised">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reports</span>
          <p className="text-2xl sm:text-3xl font-black text-civic-slate mt-1">{totalCount}</p>
        </div>
        <div className="neu-card p-5 rounded-2xl border border-slate-200/70 shadow-neu-raised">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">New Submitted</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{submittedCount}</p>
        </div>
        <div className="neu-card p-5 rounded-2xl border border-slate-200/70 shadow-neu-raised">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Under Review</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">{reviewCount}</p>
        </div>
        <div className="neu-card p-5 rounded-2xl border border-slate-200/70 shadow-neu-raised">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">In Progress</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">{inProgressCount}</p>
        </div>
        <div className="neu-card p-5 rounded-2xl border border-slate-200/70 shadow-neu-raised">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resolved</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 neu-card p-4 rounded-2xl border border-slate-200/70 shadow-neu-xs text-xs">
        <div className="flex items-center space-x-2.5">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filter Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="neu-input rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="font-bold text-slate-700">Filter Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="neu-input rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Queue List */}
      {loading ? (
        <div className="neu-card p-12 text-center text-sm text-slate-400 rounded-3xl border border-slate-200/70 shadow-neu-raised">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-civic-forest" />
          Loading report queue...
        </div>
      ) : reports.length === 0 ? (
        <div className="neu-card p-12 text-center rounded-3xl border border-dashed border-emerald-900/20 shadow-neu-raised space-y-3">
          <FileText className="w-8 h-8 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No reports in queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No incident reports found matching your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const statusMeta = STATUS_CONFIG[report.status];
            const StatusIcon = statusMeta.icon;
            const isExpanded = expandedId === report.id;

            return (
              <div
                key={report.id}
                className="neu-card rounded-3xl border border-slate-200/70 shadow-neu-raised overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {CATEGORY_LABELS[report.category] || report.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Incident #{report.id} &bull; {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-civic-slate mt-1">
                        {report.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                        {statusMeta.label}
                      </span>
                      <button
                        onClick={() => openUpdateModal(report)}
                        className="px-3 py-1 bg-civic-forest text-white rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-sm"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="inline-flex items-center font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Complainant: {report.resident_name}
                    </span>
                    <span className="inline-flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {report.location_text}
                    </span>
                    {report.admin_notes && (
                      <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                        Admin Note: {report.admin_notes}
                      </span>
                    )}
                  </div>

                  {/* Toggle Timeline */}
                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="text-xs font-semibold text-civic-forest hover:text-emerald-900 inline-flex items-center transition-colors"
                    >
                      {isExpanded ? (
                        <>Hide Audit Timeline <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
                      ) : (
                        <>View Audit Timeline ({report.status_history?.length || 1}) <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
                      )}
                    </button>
                    {report.photo_url && (
                      <a
                        href={resolveImageUrl(report.photo_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-500 hover:text-slate-800 underline flex items-center"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" /> View Photo Evidence
                      </a>
                    )}
                  </div>
                </div>

                {/* Immutable Audit Timeline */}
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
                            <p className="text-slate-600 neu-socket p-2.5 rounded-xl border border-slate-200/70 mt-1">
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

      {/* Status Update Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="neu-modal rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-neu-raised border border-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-civic-slate">
                Update Report #{editingReport.id} Status
              </h3>
              <button
                onClick={() => setEditingReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Title:</span>
              <p className="font-semibold text-slate-800">{editingReport.title}</p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-civic-forest">{editingReport.status}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transition to New Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="neu-select w-full text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  required
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Assigned for verification)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Crew dispatched / cleanup active)</option>
                  <option value="RESOLVED">RESOLVED (Waste cleared and verified)</option>
                  <option value="REJECTED">REJECTED (Invalid or out of barangay jurisdiction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Status Remarks (Visible to Resident) *
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Sanitation crew dispatched to Sitio Sampaguita. Garbage bags collected."
                  rows={2}
                  className="neu-input w-full text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Administrative Notes (Staff Only)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Assigned to Tanod Leader Santos. Fuel slip #482."
                  className="neu-input w-full text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-civic-forest"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReport(null)}
                  className="neu-btn-secondary px-4 py-2 rounded-xl text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="neu-btn-primary inline-flex items-center px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-neu-green"
                >
                  {updating ? 'Saving...' : 'Confirm Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
