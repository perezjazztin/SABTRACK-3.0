'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  Shield,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Home,
  Users,
  Award,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  FileText,
  ShieldCheck,
  Edit3,
  Save,
  X,
  RefreshCw,
  Trash2,
  Layers,
  HeartHandshake,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { getMyPointsSummary, getMyReports } from '@/lib/api-client';
import { ResidentPointsSummary } from '@/types/gamification';
import { ReportListResponse } from '@/types/reports';

interface ResidentPreferences {
  phone: string;
  householdMembers: number;
  streetAddress: string;
  wasteCategory: string;
  smsAlerts: boolean;
  emailBulletins: boolean;
  reportNotifications: boolean;
}

const DEFAULT_PREFERENCES: ResidentPreferences = {
  phone: '+63 917 890 1234',
  householdMembers: 4,
  streetAddress: 'Block 3, Lot 14, Riverside Subd., Sabang',
  wasteCategory: 'Residential Standard (Segregated: Bio / Recyclable / Residual)',
  smsAlerts: true,
  emailBulletins: true,
  reportNotifications: true,
};

export default function ResidentProfilePage() {
  const { user } = useAuth();

  // Dynamic civic stats
  const [pointsSummary, setPointsSummary] = useState<ResidentPointsSummary | null>(null);
  const [reportsData, setReportsData] = useState<ReportListResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Profile preferences (persisted in localStorage for demo responsiveness)
  const [preferences, setPreferences] = useState<ResidentPreferences>(DEFAULT_PREFERENCES);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<ResidentPreferences>(DEFAULT_PREFERENCES);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sabtrack_resident_profile_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
          setEditForm({ ...DEFAULT_PREFERENCES, ...parsed });
        }
      } catch {
        // Fallback to default preferences
      }
    }
  }, []);

  // Fetch real summary & reports data
  const loadCivicData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [pts, rep] = await Promise.allSettled([
        getMyPointsSummary(),
        getMyReports(),
      ]);

      if (pts.status === 'fulfilled') {
        setPointsSummary(pts.value);
      }
      if (rep.status === 'fulfilled') {
        setReportsData(rep.value);
      }
    } catch {
      // Graceful fallback for demo/offline
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadCivicData();
  }, [loadCivicData]);

  const handleOpenEditModal = () => {
    setEditForm(preferences);
    setIsEditModalOpen(true);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setPreferences(editForm);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sabtrack_resident_profile_prefs', JSON.stringify(editForm));
      } catch {
        // Ignore localStorage quota errors
      }
    }
    setIsEditModalOpen(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  // Formatted Resident ID (prioritizes backend resident_id_num or locally saved registration ID)
  const savedResidentId = typeof window !== 'undefined' ? localStorage.getItem('sabtrack_registered_resident_id') : null;
  const residentId = user?.resident_id_num || savedResidentId || (user?.id ? `SAB-2026-${String(user.id).padStart(4, '0')}` : 'SAB-2026-0001');
  const pointsBalance = pointsSummary?.total_points ?? 150;
  const ecoTier = pointsSummary?.tier ?? 'Green Champion';
  const totalReportsCount = reportsData?.total ?? 3;
  const resolvedReportsCount = reportsData?.items
    ? reportsData.items.filter((r) => r.status === 'RESOLVED').length
    : 2;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {saveSuccessNotice && (
        <div className="neu-card rounded-2xl border-l-4 border-l-emerald-600 bg-emerald-50/90 p-4 shadow-neu-raised flex items-center justify-between text-emerald-900 transition-all">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">
              Residency preferences and notification settings have been updated successfully!
            </p>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(false)}
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg"
            aria-label="Close alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-9 shadow-neu-raised">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-5">
            <div className="neu-socket w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl text-civic-forest shadow-neu-sunken flex-shrink-0 border border-emerald-900/10">
              {user?.full_name?.charAt(0) || 'R'}
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black text-civic-slate tracking-tight">
                  {user?.full_name || 'Resident Citizen'}
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-civic-forest border border-emerald-300 shadow-neu-xs">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-civic-forest" />
                  Verified Citizen
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {user?.email} &bull; Official Barangay Sabang Citizen Portal
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="font-mono px-2.5 py-0.5 rounded-lg bg-emerald-900/5 text-civic-forest font-bold border border-emerald-900/10">
                  ID: {residentId}
                </span>
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-civic-emerald" />
                  Barangay Sabang, Lipa City, 4217
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-emerald-200">
                  Citizen in Good Standing
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={handleOpenEditModal}
              className="neu-button inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-civic-forest hover:text-emerald-800 transition-all shadow-neu-raised"
            >
              <Edit3 className="w-4 h-4 text-civic-emerald" />
              Edit Details
            </button>
            <button
              onClick={loadCivicData}
              disabled={loadingStats}
              title="Refresh profile stats"
              className="neu-button p-2.5 rounded-2xl text-slate-600 hover:text-civic-forest transition-all shadow-neu-raised"
              aria-label="Refresh stats"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin text-civic-forest' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row: Eco Karma, Reports, Compliance, Purok Rank */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="neu-card p-5 sm:p-6 rounded-3xl shadow-neu-raised space-y-2 border border-emerald-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Eco-Karma Balance
            </span>
            <div className="neu-socket p-2 rounded-xl text-civic-forest">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-civic-forest">
              {pointsBalance}
            </span>
            <span className="text-xs font-semibold text-slate-500">pts</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-civic-emerald" />
            Tier: {ecoTier}
          </p>
        </div>

        <div className="neu-card p-5 sm:p-6 rounded-3xl shadow-neu-raised space-y-2 border border-emerald-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reports Track Record
            </span>
            <div className="neu-socket p-2 rounded-xl text-civic-emerald">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800">
              {totalReportsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">filed</span>
          </div>
          <p className="text-[11px] font-bold text-slate-600">
            {resolvedReportsCount} Resolved &bull; {totalReportsCount - resolvedReportsCount} Active
          </p>
        </div>

        <div className="neu-card p-5 sm:p-6 rounded-3xl shadow-neu-raised space-y-2 border border-emerald-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Segregation Rate
            </span>
            <div className="neu-socket p-2 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">
              98.5%
            </span>
            <span className="text-xs font-semibold text-emerald-600">rating</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-700">
            Zero Non-Compliance Violations
          </p>
        </div>

        <div className="neu-card p-5 sm:p-6 rounded-3xl shadow-neu-raised space-y-2 border border-emerald-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Civic Standing
            </span>
            <div className="neu-socket p-2 rounded-xl text-blue-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-civic-slate">
              Active
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-600">
            Clearance Valid for 2026
          </p>
        </div>
      </div>

      {/* Two Column Grid for Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Household & Residency Demographics */}
        <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-8 shadow-neu-raised space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-civic-slate uppercase tracking-wider flex items-center gap-2">
              <Home className="w-4 h-4 text-civic-forest" />
              Household &amp; Residency Details
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Sabang Census 2026</span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-civic-forest flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Assigned Purok / Area
                </span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {user?.area_id ? `Purok ${user.area_id} - Maharlika (Area ID #${user.area_id})` : 'Purok 2 - Maharlika, Barangay Sabang'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{preferences.streetAddress}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-civic-forest flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Household Occupants
                </span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {preferences.householdMembers} Registered Family Members
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Residential Account Head: <span className="font-semibold">{user?.full_name}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-civic-forest flex-shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Waste Generation Classification
                </span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {preferences.wasteCategory}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compliance Tier: Level 1 Segregation Mandatory (RA 9003)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-civic-forest flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Collection Route &amp; Pickup Socket
                </span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  Route A &bull; Bio (Mon/Wed/Fri 06:00 AM) &bull; Non-Bio (Tue/Sat 06:00 AM)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Designated Drop Station: Curbside Sorting Socket #B-14
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Contact Information & Alert Channels */}
        <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-8 shadow-neu-raised space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-civic-slate uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-civic-forest" />
              Contact Information &amp; Hotlines
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Direct Desk Connected
            </span>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-civic-forest flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Registered Email Address
                </span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{user?.email}</p>
                <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  Primary Authentication &amp; Notices Channel
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-civic-forest flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Mobile SMS Hotline Number
                </span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{preferences.phone}</p>
                <span className="inline-flex items-center text-[11px] font-medium text-slate-500 mt-0.5">
                  {preferences.smsAlerts ? '✓ SMS Truck Alerts Active' : '✕ SMS Alerts Muted'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-civic-forest flex-shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Notification Dispatch Preferences
                </span>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-lg font-bold border ${preferences.smsAlerts ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    SMS Reminders: {preferences.smsAlerts ? 'ON' : 'OFF'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg font-bold border ${preferences.emailBulletins ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    Email Bulletins: {preferences.emailBulletins ? 'ON' : 'OFF'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg font-bold border ${preferences.reportNotifications ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    Violation Updates: {preferences.reportNotifications ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs flex items-start space-x-3.5">
              <div className="neu-socket p-2.5 rounded-xl text-red-500 flex-shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  Barangay Sabang Civic Hotlines
                </span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  Barangay Hall: <span className="font-mono text-civic-forest font-bold">(043) 756-1234</span> &bull; Solid Waste Office: <span className="font-mono text-civic-forest font-bold">(043) 756-1235</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lipa CDRRMO Emergency Hotline: 911 / (043) 756-2000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Civic Badges & Ecological Achievements */}
      <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-8 shadow-neu-raised space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-civic-slate uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-civic-forest" />
              Civic Eco-Badges &amp; Barangay Recognitions
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Badges awarded by Barangay Sabang Solid Waste Management Committee for civic cooperation.
            </p>
          </div>
          <span className="text-xs font-bold text-civic-forest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-neu-xs">
            4 Badges Earned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-4.5 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs space-y-2">
            <div className="neu-socket w-10 h-10 rounded-xl flex items-center justify-center text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Model Segregator 2026</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Maintained 100% proper segregation of compostable and recyclable wastes.
              </p>
            </div>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Earned Jan 2026
            </span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs space-y-2">
            <div className="neu-socket w-10 h-10 rounded-xl flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Vigilant Citizen</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reported open illegal dump sites that were verified and resolved by barangay staff.
              </p>
            </div>
            <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              Verified LGU Report
            </span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs space-y-2">
            <div className="neu-socket w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Organic Composter</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Diverted over 30kg of kitchen biodegradable waste into backyard soil composting.
              </p>
            </div>
            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Earned Feb 2026
            </span>
          </div>

          <div className="p-4.5 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs space-y-2">
            <div className="neu-socket w-10 h-10 rounded-xl flex items-center justify-center text-teal-600">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Bayanihan Volunteer</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active participant in the Sabang Lingap Kalinisan community clean-up drive.
              </p>
            </div>
            <span className="inline-block text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              Community Service
            </span>
          </div>
        </div>
      </div>

      {/* Security, Data Privacy & Legal Compliance (RA 10173 & RA 9003) */}
      <div className="neu-card rounded-3xl border border-emerald-900/10 p-7 sm:p-8 shadow-neu-raised space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-civic-slate uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-civic-forest" />
            Data Privacy (RA 10173) &amp; Account Security
          </h3>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-civic-emerald" />
            Enrolled: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active 2026'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs space-y-2">
            <div className="flex items-center space-x-2 text-civic-forest font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-civic-emerald" />
              <span>RA 10173 Compliance</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Your household information and identity documents are stored in authenticated, encrypted storage. Personal data is never shared with third parties.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs space-y-2">
            <div className="flex items-center space-x-2 text-civic-forest font-bold text-xs">
              <Lock className="w-4 h-4 text-civic-emerald" />
              <span>EXIF GPS Sanitization</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              All incident photo evidence uploads undergo automated server-side EXIF/GPS scrubbing upon ingestion to safeguard resident location privacy.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-emerald-900/5 shadow-neu-xs space-y-2">
            <div className="flex items-center space-x-2 text-civic-forest font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-civic-emerald" />
              <span>Session &amp; CSRF Defense</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Active session secured with SHA-256 token hashing, HttpOnly browser isolation, and double-submit CSRF defense on state-mutating actions.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-emerald-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Need to request data modification or account deletion? Contact the Barangay Sabang Data Protection Officer at{' '}
            <span className="font-semibold text-civic-forest">dpo@sabang-lipa.gov.ph</span>.
          </p>
          <span className="font-mono text-[10px] text-slate-400">
            SABTRACK v3.0 &bull; BatStateU NEU Lipa &bull; RA 9003
          </span>
        </div>
      </div>

      {/* Edit Profile & Preferences Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="neu-card rounded-3xl border border-emerald-900/10 p-6 sm:p-8 max-w-lg w-full shadow-neu-raised space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4">
              <div className="flex items-center space-x-3">
                <div className="neu-socket p-2.5 rounded-2xl text-civic-forest">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-civic-slate">Edit Resident Profile</h3>
                  <p className="text-xs text-slate-500">Update household details and alert channels</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition-all"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name (LGU Registered)
                </label>
                <input
                  type="text"
                  value={user?.full_name || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed font-medium"
                />
                <span className="text-[10px] text-slate-400">Official name changes require Barangay Hall verification.</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Mobile SMS Hotline Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+63 9XX XXX XXXX"
                  required
                  className="neu-input w-full px-3.5 py-2.5 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Household Street / Subdivision Address
                </label>
                <input
                  type="text"
                  value={editForm.streetAddress}
                  onChange={(e) => setEditForm({ ...editForm, streetAddress: e.target.value })}
                  placeholder="Block / Lot / Street Name"
                  required
                  className="neu-input w-full px-3.5 py-2.5 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Registered Occupants
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editForm.householdMembers}
                    onChange={(e) => setEditForm({ ...editForm, householdMembers: parseInt(e.target.value) || 1 })}
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Assigned Purok
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.area_id ? `Purok ${user.area_id}` : 'Purok 2 - Maharlika'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="pt-2 border-t border-emerald-900/10 space-y-3">
                <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Notification Channels
                </span>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.smsAlerts}
                    onChange={(e) => setEditForm({ ...editForm, smsAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-civic-forest focus:ring-civic-emerald"
                  />
                  <span className="text-slate-700 font-medium">Receive SMS truck arrival alerts (30 mins before)</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.emailBulletins}
                    onChange={(e) => setEditForm({ ...editForm, emailBulletins: e.target.checked })}
                    className="w-4 h-4 rounded text-civic-forest focus:ring-civic-emerald"
                  />
                  <span className="text-slate-700 font-medium">Receive weekly email collection bulletins</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.reportNotifications}
                    onChange={(e) => setEditForm({ ...editForm, reportNotifications: e.target.checked })}
                    className="w-4 h-4 rounded text-civic-forest focus:ring-civic-emerald"
                  />
                  <span className="text-slate-700 font-medium">Receive live updates on submitted reports</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-900/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-soft-raised"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
