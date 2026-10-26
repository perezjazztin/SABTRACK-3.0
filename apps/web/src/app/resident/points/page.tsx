'use client';

import { useRealtimeSync } from '@/lib/use-realtime-sync';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  Calendar,
  MapPin,
  TrendingUp,
  ShieldCheck,
  FileText,
  X,
  Camera,
  Layers,
} from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import {
  getMyPointsSummary,
  getInitiatives,
  submitClaim,
} from '@/lib/api-client';
import {
  ResidentPointsSummary,
  InitiativeItem,
  ClaimCreatePayload,
} from '@/types/gamification';

export default function ResidentPointsPage() {
  const [summary, setSummary] = useState<ResidentPointsSummary | null>(null);
  const [initiatives, setInitiatives] = useState<InitiativeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'initiatives' | 'claims' | 'ledger'>('initiatives');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ClaimCreatePayload>({
    initiative_id: null,
    activity_title: '',
    description: '',
    evidence_url: '',
    points_requested: 25,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, inits] = await Promise.all([
        getMyPointsSummary(),
        getInitiatives(),
      ]);
      setSummary(sum);
      setInitiatives(inits);
    } catch (err) {
      setError('Unable to load your SAB-Points ledger.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatic real-time background synchronization
  useRealtimeSync(loadData, { entity: 'claims' });

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitClaim(form);
      setShowClaimModal(false);
      setForm({
        initiative_id: null,
        activity_title: '',
        description: '',
        evidence_url: '',
        points_requested: 25,
      });
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to submit claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectInitiative = (init: InitiativeItem) => {
    setForm({
      initiative_id: init.id,
      activity_title: `Attended: ${init.title}`,
      description: `Participated in the ${init.title} held at ${init.location}.`,
      evidence_url: '',
      points_requested: init.points_reward,
    });
    setShowClaimModal(true);
  };

  const totalPoints = summary?.total_points || 0;
  const tier = summary?.tier || 'Bronze Eco-Citizen';
  const progressPercent = Math.min(100, Math.round((totalPoints / 200) * 100));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="neu-card rounded-3xl border border-slate-200/70 p-7 sm:p-8 shadow-neu-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
              Barangay Sabang Civic Rewards
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">RA 9003 Incentive Program</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Award className="w-7 h-7 text-emerald-700" />
            SAB-Points
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Earn civic points by participating in Barangay Sabang clean-ups and waste segregation programs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowClaimModal(true)}
            className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-civic-forest hover:bg-civic-forestHover rounded-xl transition-all shadow-neu-green"
          >
            <Plus className="w-4 h-4" />
            Claim Participation
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="neu-button p-3 text-slate-600 rounded-xl transition-all shadow-neu-raised"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Points & Eco-Tier Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-civic-forest via-emerald-800 to-teal-950 text-white rounded-3xl p-7 shadow-neu-raised space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              Verified SAB-Points Balance
            </span>
            <span className="text-xs bg-emerald-700/80 text-emerald-100 px-3 py-1 rounded-full font-bold border border-emerald-500/40">
              {tier}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight">
              {totalPoints}
            </span>
            <span className="text-emerald-200 text-sm font-semibold">pts</span>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-emerald-200 font-medium">
              <span>Goal: Gold Barangay Champion (200 pts)</span>
              <span className="font-mono font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-emerald-950/60 rounded-full h-2.5 overflow-hidden border border-emerald-700/40 shadow-neu-sunken-sm">
              <div
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Verification Stats Card */}
        <div className="neu-card border border-slate-200/70 rounded-3xl p-6 sm:p-7 shadow-neu-raised space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Engagement Record
            </span>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {summary?.verified_activities_count || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified community clean-ups &amp; reports
            </p>
          </div>
          <div className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 pt-3 border-t border-slate-200/70">
            <ShieldCheck className="w-4 h-4 text-civic-emerald" />
            <span>Barangay Sabang Council Verified</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="neu-card p-2 rounded-2xl border border-slate-200/70 shadow-neu-xs flex items-center gap-2 overflow-x-auto text-xs">
        {[
          { key: 'initiatives', label: 'Clean-Up Initiatives', icon: Sparkles },
          { key: 'claims', label: 'My Submitted Claims', icon: FileText },
          { key: 'ledger', label: 'Points Ledger Audit', icon: Layers },
        ].map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'initiatives' | 'claims' | 'ledger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
              activeTab === key
                ? 'bg-civic-forest text-white shadow-neu-green'
                : 'text-slate-600 hover:text-civic-forest hover:bg-emerald-50/70'
            }`}
          >
            <TabIcon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Clean-Up Initiatives */}
      {activeTab === 'initiatives' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initiatives.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-500 bg-[#FAFDFB] border border-dashed border-slate-300 rounded-2xl text-xs shadow-soft-raised">
                No active initiatives scheduled at the moment.
              </div>
            ) : (
              initiatives.map((init) => (
                <div
                  key={init.id}
                  className="bg-[#FAFDFB] border border-slate-200/70 rounded-2xl p-5 shadow-soft-raised hover:shadow-soft-raised-lg transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                        +{init.points_reward} Points
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {init.event_date}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {init.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {init.description}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-slate-500 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{init.location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectInitiative(init)}
                    className="w-full mt-2 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-soft-raised flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Claim Points for this Activity
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: My Claims */}
      {activeTab === 'claims' && (
        <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80 shadow-neu-xs">
                <tr>
                  <th className="px-5 py-4">Activity Claim</th>
                  <th className="px-5 py-4">Points</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Submitted Date</th>
                  <th className="px-5 py-4">Review Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {!summary?.recent_claims.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      You have not submitted any participation claims yet.
                    </td>
                  </tr>
                ) : (
                  summary.recent_claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                        <div className="truncate">{claim.activity_title}</div>
                        <div className="text-[11px] text-slate-500 truncate">{claim.description}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-800">
                        +{claim.points_requested}
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
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 italic">
                        {claim.review_notes || 'Pending barangay staff review'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Immutable Ledger */}
      {activeTab === 'ledger' && (
        <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
          <div className="px-6 py-4 border-b border-white/80 bg-[#e4ecf3] flex items-center justify-between shadow-neu-xs">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Double-Entry Transaction History
            </span>
            <span className="neu-chip px-3 py-1 rounded-xl text-xs font-bold text-slate-600 bg-white">
              Total Recorded: {summary?.ledger_history.length || 0} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80 shadow-neu-xs">
                <tr>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Transaction Date</th>
                  <th className="px-5 py-4 text-right">Points Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {!summary?.ledger_history.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No points transactions recorded in the ledger yet.
                    </td>
                  </tr>
                ) : (
                  summary.ledger_history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {entry.description}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {entry.transaction_type}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        +{entry.points} pts
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Submit Claim */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neu-modal rounded-3xl border border-slate-200/70 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-neu-raised">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Claim SAB-Points for Civic Action
              </h3>
              <button
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Associated Clean-up Drive (Optional)
                </label>
                <select
                  value={form.initiative_id || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const selected = initiatives.find((i) => i.id === id);
                    setForm({
                      ...form,
                      initiative_id: id,
                      points_requested: selected ? selected.points_reward : 25,
                    });
                  }}
                  className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="">Independent Cleanliness Action (25 pts)</option>
                  {initiatives.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title} (+{i.points_reward} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  value={form.activity_title}
                  onChange={(e) =>
                    setForm({ ...form, activity_title: e.target.value })
                  }
                  placeholder="e.g. Cleaned street gutter and segregated recyclables"
                  className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description of Work Done
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Detail your civic participation or segregation drop-off..."
                  className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center">
                  <Camera className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Photo Proof / Evidence (EXIF Sanitized)
                </label>
                <ImageUpload
                  value={form.evidence_url || ''}
                  onChange={(url: string) => setForm({ ...form, evidence_url: url })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-3.5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold shadow-soft-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-white bg-civic-forest hover:bg-civic-forestHover rounded-xl font-semibold shadow-soft-raised active:shadow-soft-pressed disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
