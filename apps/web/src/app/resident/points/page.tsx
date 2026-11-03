'use client';

import { useRealtimeSync } from '@/lib/use-realtime-sync';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  FileText,
  X,
  Camera,
  Layers,
  Trophy,
  Gift,
  Star,
  Medal,
  Crown,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Users,
  Target,
} from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import {
  getMyPointsSummary,
  getInitiatives,
  submitClaim,
  getLeaderboard,
  getCivicTasks,
  getRewards,
  redeemReward,
  getMyRedemptions,
} from '@/lib/api-client';
import {
  ResidentPointsSummary,
  InitiativeItem,
  ClaimCreatePayload,
  LeaderboardEntry,
  CivicTaskItem,
  RewardItem,
  RedemptionRequest,
} from '@/types/gamification';

/* ─── constants ────────────────────────────────────────────────────── */

type Tab = 'leaderboard' | 'tasks' | 'redeem' | 'history';

const TIER_COLORS: Record<string, string> = {
  'Gold Barangay Champion': 'text-yellow-700 bg-yellow-50 border-yellow-300',
  'Silver Eco-Warrior': 'text-slate-600 bg-slate-100 border-slate-300',
  'Bronze Eco-Citizen': 'text-amber-700 bg-amber-50 border-amber-300',
};

const TIER_ICONS: Record<string, React.ElementType> = {
  'Gold Barangay Champion': Crown,
  'Silver Eco-Warrior': Medal,
  'Bronze Eco-Citizen': Star,
};

const TASK_CATEGORY_STYLES: Record<string, string> = {
  REPORTING: 'bg-blue-50 text-blue-700 border-blue-200',
  SEGREGATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLIANCE: 'bg-violet-50 text-violet-700 border-violet-200',
  MILESTONE: 'bg-amber-50 text-amber-700 border-amber-200',
};

const REDEMPTION_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-800 border-amber-300',
  APPROVED: 'bg-blue-50 text-blue-800 border-blue-300',
  FULFILLED: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-300',
};

const DEFAULT_PLACEHOLDER_IMAGE = '/images/placeholder_card.jpg';

/* ─── small helpers ─────────────────────────────────────────────────── */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

function TierBadge({ tier }: { tier: string }) {
  const Icon = TIER_ICONS[tier] ?? Star;
  const cls = TIER_COLORS[tier] ?? 'text-slate-600 bg-slate-100 border-slate-300';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      <Icon className="h-3 w-3" />
      {tier}
    </span>
  );
}

function ProgressBar({ current, total, color = 'bg-emerald-500' }: { current: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[11px] font-medium text-slate-500">
        <span>{current} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────────────────── */

export default function ResidentPointsPage() {
  const [summary, setSummary] = useState<ResidentPointsSummary | null>(null);
  const [initiatives, setInitiatives] = useState<InitiativeItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [civicTasks, setCivicTasks] = useState<CivicTaskItem[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RedemptionRequest[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim modal
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ClaimCreatePayload>({
    initiative_id: null,
    activity_title: '',
    description: '',
    evidence_url: '',
    activity_type: 'OTHER',
    points_requested: 25,
  });

  // Redeem modal
  const [redeemTarget, setRedeemTarget] = useState<RewardItem | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<RedemptionRequest | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, inits, board, tasks, rews, redemps] = await Promise.all([
        getMyPointsSummary(),
        getInitiatives(),
        getLeaderboard(),
        getCivicTasks(),
        getRewards(),
        getMyRedemptions(),
      ]);
      setSummary(sum);
      setInitiatives(inits);
      setLeaderboard(board);
      setCivicTasks(tasks);
      setRewards(rews);
      setMyRedemptions(redemps);
    } catch (err) {
      setError('Unable to load your SAB-Points data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeSync(loadData, { entity: '*' });

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
        activity_type: 'OTHER',
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
      activity_type: 'COMMUNITY_CLEANUP',
      points_requested: init.points_reward,
    });
    setShowClaimModal(true);
  };

  const handleOpenClaimModal = () => {
    setForm((currentForm) => ({ ...currentForm, activity_type: 'OTHER' }));
    setShowClaimModal(true);
  };

  const handleSelectSegregationTask = (task: CivicTaskItem) => {
    setForm({
      initiative_id: null,
      activity_title: task.title,
      description: '',
      evidence_url: '',
      activity_type: 'SEGREGATION',
      points_requested: task.points_reward,
    });
    setShowClaimModal(true);
  };

  const handleRedeem = async () => {
    if (
      !redeemTarget ||
      totalPoints < redeemTarget.points_required ||
      redeemTarget.stock_quantity <= 0
    ) return;
    setRedeemLoading(true);
    try {
      const result = await redeemReward(redeemTarget.id);
      setRedeemResult(result);
      await loadData();
    } catch (err: unknown) {
      alert((err as Error).message || 'Redemption failed.');
      setRedeemTarget(null);
    } finally {
      setRedeemLoading(false);
    }
  };

  const totalPoints = summary?.total_points ?? 0;
  const tier = summary?.tier ?? 'Bronze Eco-Citizen';
  const progressPercent = Math.min(100, Math.round((totalPoints / 200) * 100));

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { key: 'tasks', label: 'Civic Tasks', icon: Target },
    { key: 'redeem', label: 'Redeem Rewards', icon: Gift },
    { key: 'history', label: 'My Claims & Vouchers', icon: FileText },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
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
            Earn civic points by participating in Barangay Sabang clean-ups, waste segregation programs, and community reporting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenClaimModal}
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

      {/* ── Balance Banner ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        <div className="bg-gradient-to-br from-civic-forest via-emerald-800 to-teal-950 text-white rounded-3xl p-7 shadow-neu-raised space-y-4 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              Verified SAB-Points Balance
            </span>
            <TierBadge tier={tier} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black tracking-tight">{totalPoints}</span>
            <span className="text-emerald-200 text-sm font-semibold">pts</span>
          </div>
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-emerald-200 font-medium">
              <span>Goal: Gold Barangay Champion (200 pts)</span>
              <span className="font-mono font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-emerald-950/60 rounded-full h-2.5 overflow-hidden border border-emerald-700/40">
              <div className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
        <div className="neu-card border border-slate-200/70 rounded-3xl p-6 sm:p-7 shadow-neu-raised space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement Record</span>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {summary?.verified_activities_count ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Verified community clean-ups &amp; reports</p>
          </div>
          <div className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 pt-3 border-t border-slate-200/70">
            <ShieldCheck className="w-4 h-4 text-civic-emerald" />
            <span>Barangay Sabang Council Verified</span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="neu-card p-2 rounded-2xl border border-slate-200/70 shadow-neu-xs flex items-center gap-2 overflow-x-auto text-xs">
        {TABS.map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
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

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: LEADERBOARD
      ════════════════════════════════════════════════════════════════ */}
      {!error && activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Community Leaderboard
            </h2>
            <span className="text-xs text-slate-500">Top {leaderboard.length} civic champions</span>
          </div>

          {loading && leaderboard.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">No leaderboard data yet. Start earning SAB-Points!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const RankIcon = entry.rank === 1 ? Crown : entry.rank === 2 ? Medal : entry.rank === 3 ? Star : null;
                return (
                  <div
                    key={entry.resident_id}
                    className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                      entry.is_current_user
                        ? 'border-emerald-400 bg-emerald-50 shadow-md'
                        : 'border-slate-200/80 bg-white hover:border-emerald-200 hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                      entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      entry.rank === 2 ? 'bg-slate-100 text-slate-600' :
                      entry.rank === 3 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {RankIcon ? <RankIcon className="h-5 w-5" /> : `#${entry.rank}`}
                    </div>
                    {/* Name & Area */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {entry.display_name}
                        {entry.is_current_user && (
                          <span className="ml-2 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">You</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{entry.purok_name}</p>
                    </div>
                    {/* Tier & Points */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-black text-slate-900">{entry.total_points} <span className="text-xs font-semibold text-slate-500">pts</span></p>
                      <TierBadge tier={entry.tier} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: CIVIC TASKS
      ════════════════════════════════════════════════════════════════ */}
      {!error && activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-700" />
              Civic Tasks &amp; Missions
            </h2>
            <span className="text-xs text-slate-500">Complete tasks to earn SAB-Points</span>
          </div>

          {loading && civicTasks.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {civicTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                const isUnavailable = task.status === 'UNAVAILABLE';
                const canClaimAgain = isCompleted && task.is_repeatable && task.action_type === 'CLAIM_SEGREGATION';
                const catStyle = TASK_CATEGORY_STYLES[task.category] ?? 'bg-slate-50 text-slate-700 border-slate-200';
                return (
                  <article
                    key={task.id}
                    aria-labelledby={`task-${task.id}`}
                    className={`rounded-2xl border overflow-hidden shadow-sm flex flex-col justify-between transition-all ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : isUnavailable
                        ? 'border-slate-200 bg-slate-50/70'
                        : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="relative w-full h-44 overflow-hidden bg-slate-100 flex-shrink-0">
                      <img
                        src={task.image_url || DEFAULT_PLACEHOLDER_IMAGE}
                        alt={task.title}
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${catStyle}`}>
                            {task.category.replace(/_/g, ' ')}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isUnavailable
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : isUnavailable ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {isCompleted ? 'Completed' : isUnavailable ? 'Unavailable' : task.status === 'IN_PROGRESS' ? 'In Progress' : 'Available'}
                          </span>
                        </div>
                        <h3 id={`task-${task.id}`} className="font-extrabold text-slate-900 text-sm leading-snug">{task.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                        <ProgressBar
                          current={task.progress_current}
                          total={task.progress_target}
                          color={isCompleted ? 'bg-emerald-500' : isUnavailable ? 'bg-slate-400' : 'bg-amber-400'}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                        <span className="text-sm font-black text-emerald-700">+{task.points_reward} pts</span>
                        {task.action_type === 'SUBMIT_REPORT' && !isCompleted && !isUnavailable && (
                          <Link
                            href="/resident/reports"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all"
                          >
                            File Report <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {task.action_type === 'CLAIM_SEGREGATION' && (!isCompleted || canClaimAgain) && !isUnavailable && (
                          <button
                            onClick={() => handleSelectSegregationTask(task)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all"
                          >
                            {canClaimAgain ? 'Claim again' : 'Claim'} +{task.points_reward} pts
                          </button>
                        )}
                        {isCompleted && !canClaimAgain && (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 3: REDEEM REWARDS
      ════════════════════════════════════════════════════════════════ */}
      {!error && activeTab === 'redeem' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-violet-600" />
              Rewards Catalog
            </h2>
            <span className="text-xs text-slate-500">Your balance: <strong className="text-emerald-700">{totalPoints} pts</strong></span>
          </div>
          <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            Catalog items and vouchers are academic demonstration records only. No phone credit, procurement, or goods delivery is provided.
          </p>

          {loading && rewards.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-52" />)}
            </div>
          ) : rewards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <Gift className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">No rewards available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {rewards.map((reward) => {
                const canAfford = totalPoints >= reward.points_required;
                const canRedeem = canAfford && reward.stock_quantity > 0;
                return (
                  <div
                    key={reward.id}
                    className={`rounded-2xl border overflow-hidden flex flex-col shadow-sm transition-all ${
                    canRedeem
                        ? 'border-emerald-200 bg-white hover:shadow-md hover:border-emerald-400'
                        : 'border-slate-200/80 bg-slate-50/50 opacity-70'
                    }`}
                  >
                    <div className="relative w-full h-44 overflow-hidden bg-slate-100 flex-shrink-0">
                      <img
                        src={reward.image_url || DEFAULT_PLACEHOLDER_IMAGE}
                        alt={reward.name}
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{reward.name}</h3>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">{reward.description}</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Cost</span>
                          <span className="text-sm font-black text-emerald-700">{reward.points_required.toLocaleString()} pts</span>
                        </div>
                        <button
                          onClick={() => { setRedeemTarget(reward); setRedeemResult(null); }}
                          disabled={!canRedeem}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                            canAfford && reward.stock_quantity > 0
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {!canAfford
                            ? `Need ${(reward.points_required - totalPoints).toLocaleString()} more pts`
                            : reward.stock_quantity <= 0
                            ? 'Out of stock'
                            : 'Redeem Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB 4: MY CLAIMS & VOUCHERS
      ════════════════════════════════════════════════════════════════ */}
      {!error && activeTab === 'history' && (
        <div className="space-y-6">
          {/* My Redemption Vouchers */}
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-3">
              <Ticket className="w-5 h-5 text-violet-600" />
              My Reward Vouchers
            </h2>
            {myRedemptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-xs text-slate-500">
                No redeemed vouchers yet. Earn enough points to redeem prizes!
              </div>
            ) : (
              <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80">
                      <tr>
                        <th className="px-5 py-4">Reward</th>
                        <th className="px-5 py-4">Voucher Code</th>
                        <th className="px-5 py-4">Points Spent</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Date Redeemed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 bg-white">
                      {myRedemptions.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900">{r.reward_name}</td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 border border-slate-200">
                              {r.claim_code}
                            </code>
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-700">-{r.points_spent}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${REDEMPTION_STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* My Participation Claims */}
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-emerald-700" />
              Participation Claims
            </h2>
            <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80">
                    <tr>
                      <th className="px-5 py-4">Activity Claim</th>
                      <th className="px-5 py-4">Points</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Submitted</th>
                      <th className="px-5 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 bg-white">
                    {!summary?.recent_claims.length ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No participation claims submitted yet.
                        </td>
                      </tr>
                    ) : (
                      summary.recent_claims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                            <div className="truncate">{claim.activity_title}</div>
                            <div className="text-[11px] text-slate-500 truncate">{claim.description}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-800">+{claim.points_requested}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              claim.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : claim.status === 'REJECTED'
                                ? 'bg-red-50 text-red-800 border-red-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{new Date(claim.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-slate-600 italic">{claim.review_notes || 'Pending barangay staff review'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Points Ledger Audit */}
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-3">
              <Layers className="w-5 h-5 text-slate-600" />
              Points Ledger Audit
            </h2>
            <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
              <div className="px-6 py-4 border-b border-white/80 bg-[#e4ecf3] flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">Double-Entry Transaction History</span>
                <span className="neu-chip px-3 py-1 rounded-xl text-xs font-bold text-slate-600 bg-white">
                  {summary?.ledger_history.length ?? 0} entries
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#e4ecf3] text-slate-800 font-black uppercase tracking-wider text-[11px] border-b border-white/80">
                    <tr>
                      <th className="px-5 py-4">Description</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 bg-white">
                    {!summary?.ledger_history.length ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                          No points transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      summary.ledger_history.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900">{entry.description}</td>
                          <td className="px-4 py-3 text-slate-500">{entry.transaction_type.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 text-slate-500">{new Date(entry.created_at).toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-bold ${entry.points >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {entry.points >= 0 ? '+' : ''}{entry.points} pts
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CLAIM MODAL
      ════════════════════════════════════════════════════════════════ */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neu-modal rounded-3xl border border-slate-200/70 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-neu-raised max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Claim SAB-Points for Civic Action</h3>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitClaim} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Associated Clean-up Drive (Optional)</label>
                <select
                  value={form.initiative_id || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const selected = initiatives.find((i) => i.id === id);
                    setForm({ ...form, initiative_id: id, points_requested: selected ? selected.points_reward : 25 });
                  }}
                  className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="">Independent Cleanliness Action (25 pts)</option>
                  {initiatives.map((i) => (
                    <option key={i.id} value={i.id}>{i.title} (+{i.points_reward} pts)</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="claim-activity-title" className="block font-medium text-slate-700 mb-1">Activity Title</label>
                <input
                  id="claim-activity-title"
                  type="text"
                  value={form.activity_title}
                  onChange={(e) => setForm({ ...form, activity_title: e.target.value })}
                  placeholder="e.g. Cleaned street gutter and segregated recyclables"
                  className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>
              <div>
                <label htmlFor="claim-description" className="block font-medium text-slate-700 mb-1">Description of Work Done</label>
                <textarea
                  id="claim-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                <button type="button" onClick={() => setShowClaimModal(false)} className="px-3.5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-white bg-civic-forest hover:bg-civic-forestHover rounded-xl font-semibold disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          REDEEM CONFIRMATION MODAL
      ════════════════════════════════════════════════════════════════ */}
      {redeemTarget && !redeemResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="redeem-confirm-title"
            className="neu-modal rounded-3xl border border-slate-200/70 max-w-sm w-full p-6 sm:p-7 space-y-5 shadow-neu-raised"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 id="redeem-confirm-title" className="font-bold text-slate-900 text-base">Confirm Redemption</h3>
              <button onClick={() => setRedeemTarget(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="font-bold text-slate-900">{redeemTarget.name}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{redeemTarget.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] text-slate-500 font-medium">Your Balance</p>
                  <p className="text-base font-black text-slate-900">{totalPoints}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-[11px] text-rose-600 font-medium">Cost</p>
                  <p className="text-base font-black text-rose-700">-{redeemTarget.points_required}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] text-emerald-600 font-medium">Remaining</p>
                  <p className="text-base font-black text-emerald-700">{totalPoints - redeemTarget.points_required}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                Academic demonstration voucher only; it does not provide phone credit or represent goods delivered.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setRedeemTarget(null)} className="px-3.5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-xs">Cancel</button>
              <button
                onClick={handleRedeem}
                disabled={redeemLoading || totalPoints < redeemTarget.points_required || redeemTarget.stock_quantity <= 0}
                className="px-4 py-2 text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl font-semibold text-xs disabled:opacity-50"
              >
                {redeemLoading ? 'Processing...' : 'Confirm Redemption'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redemption Success Modal */}
      {redeemResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="neu-modal rounded-3xl border border-emerald-300 max-w-sm w-full p-7 space-y-5 shadow-neu-raised text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Redemption Successful!</h3>
              <p className="text-xs text-slate-500 mt-1">This is an academic demonstration voucher only; it does not represent goods delivered or phone credit.</p>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50 py-4 px-6">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-widest">Voucher Claim Code</p>
              <p className="mt-1 text-2xl font-black tracking-widest text-emerald-900 font-mono">{redeemResult.claim_code}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">{redeemResult.reward_name}</p>
            </div>
            <button
              onClick={() => { setRedeemResult(null); setRedeemTarget(null); setActiveTab('history'); }}
              className="w-full py-3 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-2xl transition-all"
            >
              Done — View My Vouchers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
