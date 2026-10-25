'use client';

import React, { useState } from 'react';
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
  Lock,
  Menu,
  X,
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
    minRole: 'BARANGAY_STAFF',
    viewOnlyForStaff: true,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentNav =
    ADMIN_NAV.find((item) => item.href === pathname) || ADMIN_NAV[0];

  return (
    <ProtectedRoute
      requiredRole={['BARANGAY_STAFF', 'BARANGAY_ADMIN']}
      moduleName="Barangay Administrative Portal"
    >
      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-4rem)] w-full bg-[#edf2f7]">
        {/* Mobile Header Bar with Three Horizontal Lines (Visible only when minimized / mobile screens) */}
        <div className="md:hidden sticky top-16 z-30 bg-[#edf2f7] border-b border-white/80 px-4 py-3 flex items-center justify-between shadow-neu-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="neu-button p-2 rounded-xl text-slate-700 hover:text-emerald-800 shadow-neu-xs flex items-center justify-center transition-all"
              aria-label="Toggle admin navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-emerald-800" />
              ) : (
                <Menu className="w-5 h-5 text-emerald-800" />
              )}
            </button>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {user?.role === 'BARANGAY_STAFF' ? 'Staff Console:' : 'Admin:'}
              </span>
              <span className="text-xs font-black text-slate-900">
                {currentNav.label}
              </span>
            </div>
          </div>

        </div>

        {/* Mobile Drawer (Collapsed by default, opens via the three horizontal lines) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#edf2f7] border-b border-white/80 p-4 space-y-3 shadow-neu-raised animate-fadeIn">
            <nav className="space-y-1.5" aria-label="Mobile Administrative Portal Navigation">
              {ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const requiresAdmin = item.minRole === 'BARANGAY_ADMIN';
                const isPermitted = user?.role === 'BARANGAY_ADMIN' || !requiresAdmin;
                const isViewOnly = user?.role === 'BARANGAY_STAFF' && (item as any).viewOnlyForStaff;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-emerald-700 text-white font-semibold shadow-soft-raised'
                        : isPermitted
                        ? 'text-slate-600 hover:text-emerald-800 hover:bg-slate-200/60'
                        : 'text-slate-400 opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-700'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {isViewOnly && !isActive && (
                      <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded font-mono border border-slate-300/60">
                        View Only
                      </span>
                    )}

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
        )}

        {/* Full-Height Sticky Sidebar Flush to Left for Desktop (Hidden on mobile) */}
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0 bg-[#edf2f7] border-r border-white/80 md:sticky md:top-16 md:h-[calc(100vh-4rem)] flex-col justify-between overflow-y-auto p-4 lg:p-5 shadow-[6px_0_16px_rgba(163,177,198,0.35)]">
          <div className="space-y-4">
            {/* Navigation Menu */}
            <nav className="space-y-1.5" aria-label="Administrative Portal Navigation">
              {ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const requiresAdmin = item.minRole === 'BARANGAY_ADMIN';
                const isPermitted = user?.role === 'BARANGAY_ADMIN' || !requiresAdmin;
                const isViewOnly = user?.role === 'BARANGAY_STAFF' && (item as any).viewOnlyForStaff;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-emerald-700 text-white font-semibold'
                        : isPermitted
                        ? 'text-slate-600 hover:text-emerald-800 hover:bg-slate-200/60'
                        : 'text-slate-400 opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-700'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {isViewOnly && !isActive && (
                      <span className="inline-flex items-center text-[10px] text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded font-mono border border-slate-300/60">
                        View Only
                      </span>
                    )}

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

          {/* Sidebar Footer Attribution */}
          <div className="pt-4 border-t border-slate-300/60 mt-6 text-center">
            <p className="text-[10px] text-slate-400 font-mono">
              SABTRACK v3.0 &bull; Barangay Sabang
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
