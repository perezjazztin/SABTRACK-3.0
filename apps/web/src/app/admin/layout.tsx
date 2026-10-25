'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  FileCheck2,
  CalendarDays,
  Award,
  BarChart3,
  Megaphone,
  Users,
  ShieldAlert,
  Lock,
  Database,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ADMIN_NAV = [
  {
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    minRole: 'BARANGAY_STAFF',
  },
  {
    label: 'Report Management',
    href: '/admin/reports',
    icon: FileCheck2,
    minRole: 'BARANGAY_STAFF',
  },
  {
    label: 'Collection Schedules',
    href: '/admin/schedules',
    icon: CalendarDays,
    minRole: 'BARANGAY_ADMIN',
  },
  {
    label: 'Community Participation',
    href: '/admin/participation',
    icon: Award,
    minRole: 'BARANGAY_STAFF',
  },
  {
    label: 'Analytics & Insights',
    href: '/admin/analytics',
    icon: BarChart3,
    minRole: 'BARANGAY_ADMIN',
  },
  {
    label: 'Announcements',
    href: '/admin/announcements',
    icon: Megaphone,
    minRole: 'BARANGAY_STAFF',
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: Users,
    minRole: 'BARANGAY_ADMIN',
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <ProtectedRoute
      requiredRole={['BARANGAY_STAFF', 'BARANGAY_ADMIN']}
      moduleName="Barangay Administrative Portal"
    >
      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-4rem)] w-full bg-[#edf2f7]">
        {/* Full-Height Sticky Sidebar Flush to Left */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-[#edf2f7] border-r border-white/80 md:sticky md:top-16 md:h-[calc(100vh-4rem)] flex flex-col justify-between overflow-y-auto p-4 lg:p-5 shadow-[4px_0_14px_rgba(163,177,198,0.25)]">
          <div className="space-y-6">
            {/* Administrative Sidebar Header */}
            <div className="neu-card p-3 rounded-2xl flex items-center justify-between shadow-neu-sm border border-white/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white shadow-neu-green flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-emerald-100" />
                </div>
                <div>
                  <span className="text-[12px] font-black text-slate-900 uppercase tracking-wider block">
                    Admin Console
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">Barangay Governance</p>
                </div>
              </div>
              <span className="neu-chip inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                Staff Ops
              </span>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5" aria-label="Administrative Portal Navigation">
              {ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const requiresAdmin = item.minRole === 'BARANGAY_ADMIN';
                const isPermitted = user?.role === 'BARANGAY_ADMIN' || !requiresAdmin;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-2xl text-xs transition-all duration-200',
                      isActive
                        ? 'bg-emerald-700 text-white shadow-neu-green font-bold border border-emerald-600/40'
                        : isPermitted
                        ? 'neu-btn-secondary text-slate-700 hover:text-emerald-800 hover:shadow-neu-raised font-semibold'
                        : 'neu-socket text-slate-400 opacity-60 cursor-not-allowed font-medium'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0',
                          isActive ? 'text-emerald-300' : 'text-slate-400'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {!isPermitted && (
                      <span className="inline-flex items-center text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded font-mono border border-rose-200/60">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        Admin
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Telemetry and System Governance Card at Bottom */}
          <div className="pt-4 border-t border-slate-300/60 mt-6 space-y-3">
            <div className="neu-card p-4 rounded-2xl shadow-neu-sm border border-white/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-civic-forest uppercase tracking-wider flex items-center">
                  <Activity className="w-3 h-3 mr-1 text-emerald-600" />
                  Live Telemetry
                </span>
                <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  Healthy
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px]">Database:</span>
                  <span className="font-mono text-[10px] font-semibold text-emerald-800 flex items-center">
                    <Database className="w-2.5 h-2.5 mr-1" /> PostgreSQL 16
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px]">Active Role:</span>
                  <span className="font-mono text-[10px] font-bold text-civic-forest">
                    {user?.role || 'STAFF'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center font-mono">
              SABTRACK v3.0 &bull; Lipa City, Batangas
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 min-w-0 bg-[#edf2f7] overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
