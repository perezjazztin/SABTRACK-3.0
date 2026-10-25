'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Pin,
  Calendar,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  FileText,
  Search,
  RefreshCw,
  Tag,
  Clock,
  User,
} from 'lucide-react';
import { getAnnouncements } from '@/lib/api-client';
import {
  AnnouncementItem,
  AnnouncementCategory,
} from '@/types/announcements';

const CATEGORY_TABS: { key: string; label: string; icon: React.ElementType }[] = [
  { key: 'ALL', label: 'All Notices', icon: Bell },
  { key: 'CLEANUP_DRIVE', label: 'Clean-Up Drives', icon: Sparkles },
  { key: 'HOLIDAY_SCHEDULE', label: 'Holiday Shifts', icon: Calendar },
  { key: 'EMERGENCY', label: 'Emergency Alerts', icon: AlertTriangle },
  { key: 'POLICY_UPDATE', label: 'RA 9003 Policies', icon: ShieldAlert },
  { key: 'GENERAL', label: 'General', icon: FileText },
];

const CATEGORY_CONFIG: Record<
  AnnouncementCategory,
  { label: string; badgeClass: string; icon: React.ElementType }
> = {
  GENERAL: {
    label: 'General Notice',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: FileText,
  },
  CLEANUP_DRIVE: {
    label: 'Clean-Up Drive',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: Sparkles,
  },
  HOLIDAY_SCHEDULE: {
    label: 'Holiday Schedule',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Calendar,
  },
  EMERGENCY: {
    label: 'Emergency Alert',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertTriangle,
  },
  POLICY_UPDATE: {
    label: 'RA 9003 Policy',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: ShieldAlert,
  },
};

export default function ResidentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const categoryParam =
        selectedCategory === 'ALL' ? undefined : selectedCategory;
      const res = await getAnnouncements(categoryParam);
      setAnnouncements(res.items);
    } catch (err) {
      setError('Unable to load official advisories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side search filter
  const filtered = announcements.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.content.toLowerCase().includes(query)
    );
  });

  const pinnedItems = filtered.filter((a) => a.is_pinned);
  const regularItems = filtered.filter((a) => !a.is_pinned);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-emerald-700" />
            Official Barangay Advisories
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Verified solid waste announcements, cleanup drives, and holiday schedules from Barangay Sabang Council.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search announcements..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Pinned Announcements */}
      {pinnedItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-emerald-700" />
            Pinned Bulletins
          </h2>
          <div className="space-y-3">
            {pinnedItems.map((item) => {
              const config = CATEGORY_CONFIG[item.category];
              const IconComp = config.icon;

              return (
                <div
                  key={item.id}
                  className="bg-emerald-50/70 border-2 border-emerald-300 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                        <Pin className="w-3 h-3 text-emerald-700" />
                        Featured
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}
                      >
                        <IconComp className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-700 mt-2 whitespace-pre-line leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60 text-xs text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issued by: {item.author_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Announcements */}
      <div className="space-y-3">
        {pinnedItems.length > 0 && regularItems.length > 0 && (
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All Advisories
          </h2>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-sm space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700">No announcements found</p>
            <p className="text-xs text-slate-500">
              There are currently no published advisories in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regularItems.map((item) => {
              const config = CATEGORY_CONFIG[item.category];
              const IconComp = config.icon;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                      >
                        <IconComp className="w-3 h-3" />
                        {config.label}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-4 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {item.author_name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
