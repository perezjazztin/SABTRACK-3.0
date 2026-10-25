'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  User,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  getAllClaims,
  getInitiatives,
  createInitiative,
  reviewClaim,
} from '@/lib/api-client';
import {
  ClaimItem,
  InitiativeItem,
  InitiativeCreatePayload,
  ClaimReviewPayload,
} from '@/types/gamification';

export default function AdminParticipationPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [initiatives, setInitiatives] = useState<InitiativeItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [customPoints, setCustomPoints] = useState<number>(25);
  const [reviewing, setReviewing] = useState(false);

  // Create initiative modal
  const [showInitModal, setShowInitModal] = useState(false);
  const [initForm, setInitForm] = useState<InitiativeCreatePayload>({
    title: '',
    description: '',
    points_reward: 50,
    event_date: '',
    location: '',
  });
  const [creatingInit, setCreatingInit] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [claimList, initList] = await Promise.all([
        getAllClaims(statusFilter === 'ALL' ? undefined : statusFilter),
        getInitiatives(),
      ]);
      setClaims(claimList);
      setInitiatives(initList);
    } catch (err) {
      setError('Failed to fetch claims and initiatives.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open review modal
  const handleOpenReview = (claim: ClaimItem) => {
    setSelectedClaim(claim);
    setReviewNotes('');
    setCustomPoints(claim.points_requested);
  };

  // Submit Review (Approve or Reject)
  const handleReviewDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedClaim) return;
    setReviewing(true);
    try {
      const payload: ClaimReviewPayload = {
        status,
        review_notes: reviewNotes.trim() || undefined,
        points_awarded: status === 'APPROVED' ? customPoints : undefined,
      };
      await reviewClaim(selectedClaim.id, payload);
      setSelectedClaim(null);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to review claim.');
    } finally {
      setReviewing(false);
    }
  };

  // Handle Create Initiative
  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInit(true);
    try {
      await createInitiative(initForm);
      setShowInitModal(false);
      setInitForm({
        title: '',
        description: '',
        points_reward: 50,
        event_date: '',
        location: '',
      });
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to create initiative.');
    } finally {
      setCreatingInit(false);
    }
  };

  return (
    <ProtectedRoute
      requiredPermission="participation:review"
      moduleName="SAB-Points Verification & Cleanliness Initiatives"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-7 h-7 text-emerald-700" />
              SAB-Points Verification &amp; Cleanliness Initiatives
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Review resident participation claims, verify environmental proof, and award tamper-proof ledger points.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowInitModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Initiative
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

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 border rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span>Filter Claims:</span>
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            Showing {claims.length} claims
          </span>
        </div>

        {/* Claims Review Queue Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Resident Participation Claims Queue
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3">Civic Action Title</th>
                  <th className="px-4 py-3">Points Requested</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {claims.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No claims found matching status filter "{statusFilter}".
                    </td>
                  </tr>
                ) : (
                  claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {claim.resident_name}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {claim.activity_title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {claim.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-800">
                        +{claim.points_requested} pts
                      </td>
                      <td className="px-4 py-3">
                        {claim.evidence_url ? (
                          <a
                            href={claim.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                          >
                            <span>View Proof</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400">None attached</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            claim.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : claim.status === 'REJECTED'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {claim.status === 'PENDING' ? (
                          <button
                            onClick={() => handleOpenReview(claim)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium transition-colors"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Reviewed ({claim.reviewed_by_name || 'Staff'})
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

        {/* Modal: Review Claim */}
        {selectedClaim && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Verify Participation Claim #{selectedClaim.id}
                </h3>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-slate-500">Resident: </span>
                  <span className="font-semibold text-slate-800">
                    {selectedClaim.resident_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Action: </span>
                  <span className="font-semibold text-slate-800">
                    {selectedClaim.activity_title}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Description: </span>
                  <p className="text-slate-700 mt-0.5">{selectedClaim.description}</p>
                </div>
                {selectedClaim.evidence_url && (
                  <div>
                    <span className="text-slate-500">Evidence Link: </span>
                    <a
                      href={selectedClaim.evidence_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 underline break-all"
                    >
                      {selectedClaim.evidence_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Points to Award upon Approval
                  </label>
                  <input
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Number(e.target.value))}
                    min={1}
                    max={500}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Official Verification Remarks / Justification
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Verified with clean-up drive roll-call list..."
                    className="w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => handleReviewDecision('REJECTED')}
                    disabled={reviewing}
                    className="px-3.5 py-1.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg font-medium disabled:opacity-50"
                  >
                    Reject Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewDecision('APPROVED')}
                    disabled={reviewing}
                    className="px-4 py-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg font-medium disabled:opacity-50"
                  >
                    {reviewing ? 'Processing...' : 'Approve & Issue Points'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Initiative */}
        {showInitModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Create Clean-up Drive or Campaign
                </h3>
                <button
                  onClick={() => setShowInitModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInitiative} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Initiative Title
                  </label>
                  <input
                    type="text"
                    value={initForm.title}
                    onChange={(e) => setInitForm({ ...initForm, title: e.target.value })}
                    placeholder="e.g. Barangay Sabang Riverbank Clean-Up Drive"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Event Date
                    </label>
                    <input
                      type="text"
                      value={initForm.event_date}
                      onChange={(e) =>
                        setInitForm({ ...initForm, event_date: e.target.value })
                      }
                      placeholder="e.g. November 7, 2026"
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Points Reward
                    </label>
                    <input
                      type="number"
                      value={initForm.points_reward}
                      onChange={(e) =>
                        setInitForm({
                          ...initForm,
                          points_reward: Number(e.target.value),
                        })
                      }
                      min={5}
                      max={500}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Designated Location
                  </label>
                  <input
                    type="text"
                    value={initForm.location}
                    onChange={(e) =>
                      setInitForm({ ...initForm, location: e.target.value })
                    }
                    placeholder="e.g. Barangay Sabang Hall and Plaza"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Activity Description
                  </label>
                  <textarea
                    rows={3}
                    value={initForm.description}
                    onChange={(e) =>
                      setInitForm({ ...initForm, description: e.target.value })
                    }
                    placeholder="Instructions, provided gear, and guidelines for participants..."
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowInitModal(false)}
                    className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingInit}
                    className="px-4 py-1.5 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-50"
                  >
                    {creatingInit ? 'Saving...' : 'Save Initiative'}
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
