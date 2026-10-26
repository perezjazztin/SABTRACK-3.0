'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  Calendar,
  FileText,
  Award,
  Bell,
  User,
  LayoutDashboard,
  BookOpen,
  PhoneCall,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardFooter } from '@/components/DashboardFooter';

export const RESIDENT_NAV = [
  { label: 'Dashboard', href: '/resident', icon: LayoutDashboard },
  { label: 'Collection Schedules', href: '/resident/schedules', icon: Calendar },
  { label: 'My Reports', href: '/resident/reports', icon: FileText },
  { label: 'SAB-Points', href: '/resident/points', icon: Award },
  { label: 'Announcements', href: '/resident/announcements', icon: Bell },
  { label: 'AwarenessHub', href: '/resident/awareness', icon: BookOpen },
  { label: 'Profile', href: '/resident/profile', icon: User },
];

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentNav =
    RESIDENT_NAV.find((item) => item.href === pathname) || RESIDENT_NAV[0];

  return (
    <ProtectedRoute
      requiredRole="RESIDENT"
      moduleName="Resident Portal"
    >
      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-4rem)] w-full">
        {/* Mobile Header Bar with Three Horizontal Lines (Visible only when minimized / mobile screens) */}
        <div className="md:hidden sticky top-16 z-30 bg-white border-b border-slate-200/70 px-4 py-3 flex items-center justify-between shadow-neu-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="neu-button p-2 rounded-xl text-slate-700 hover:text-civic-forest shadow-neu-xs flex items-center justify-center transition-all"
              aria-label="Toggle portal navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-civic-forest" />
              ) : (
                <Menu className="w-5 h-5 text-civic-forest" />
              )}
            </button>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Portal:
              </span>
              <span className="text-xs font-black text-slate-900">
                {currentNav.label}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-civic-forest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-neu-xs">
            Resident Portal
          </span>
        </div>

        {/* Mobile Drawer (Collapsed by default, opens via the three horizontal lines) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200/70 p-4 space-y-4 shadow-neu-sm animate-fadeIn">
            <nav className="space-y-1.5" aria-label="Mobile Resident Portal Navigation">
              {RESIDENT_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'group flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-civic-forest text-white font-bold shadow-neu-xs'
                        : 'text-slate-600 hover:text-civic-forest hover:bg-emerald-50/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-700'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Civic Assistance Card */}
            <div className="pt-3 border-t border-slate-200/60">
              <div className="neu-card p-3.5 rounded-2xl shadow-neu-sm border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shadow-neu-xs">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Barangay Desk Hotline
                    </span>
                    <span className="text-xs font-bold text-slate-900">(043) 756-1234</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full-Height Sticky Neumorphic Sidebar for Desktop (Hidden on mobile) */}
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-shrink-0 bg-white border-r border-slate-200/70 md:sticky md:top-16 md:h-[calc(100vh-4rem)] flex-col justify-between overflow-y-auto p-4 lg:p-5 shadow-neu-xs">
          <div className="space-y-4">
            {/* Flat Navigation Menu inside Neumorphic Sidebar */}
            <nav className="space-y-1.5" aria-label="Resident Portal Navigation">
              {RESIDENT_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-civic-forest text-white font-bold shadow-neu-xs'
                        : 'text-slate-600 hover:text-civic-forest hover:bg-emerald-50/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-700'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Neumorphic Civic Assistance Card at Bottom of Sidebar */}
          <div className="pt-4 border-t border-slate-200/60 mt-6 space-y-3">
            <div className="neu-card p-4 rounded-2xl shadow-neu-sm border border-slate-200/70 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-[11px] uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shadow-neu-xs">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <span>Barangay Desk</span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                Hotline: (043) 756-1234
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Brgy. Sabang Solid Waste Management Office &bull; Lipa City
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 min-w-0 bg-[#f4f8f5] overflow-y-auto flex flex-col justify-between">
          <div className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-10 w-full flex-1">
            {children}
          </div>
          <DashboardFooter />
        </section>
      </div>
    </ProtectedRoute>
  );
}
