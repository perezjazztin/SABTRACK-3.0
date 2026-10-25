'use client';

import React from 'react';
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
  Shield,
  BookOpen,
  PhoneCall,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <ProtectedRoute
      requiredRole={['RESIDENT', 'BARANGAY_STAFF', 'BARANGAY_ADMIN']}
      moduleName="Resident Portal"
    >
      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-4rem)] w-full">
        {/* Full-Height Sticky Sidebar Flush to Left Edge */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-[#FAFDFB] border-r border-emerald-900/10 md:sticky md:top-16 md:h-[calc(100vh-4rem)] flex flex-col justify-between overflow-y-auto p-4 lg:p-5 shadow-sm">
          <div className="space-y-6">
            {/* Sidebar Portal Header */}
            <div className="px-2 py-1.5 flex items-center justify-between border-b border-emerald-900/10 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/90 border border-emerald-200/70 flex items-center justify-center text-civic-forest shadow-soft-raised">
                  <Shield className="w-4 h-4 text-civic-emerald" />
                </div>
                <div>
                  <span className="text-[12px] font-black text-civic-forest uppercase tracking-wider block">
                    Resident Portal
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">Community Services</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Online
              </span>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5" aria-label="Resident Portal Navigation">
              {RESIDENT_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-civic-forest text-white shadow-soft-raised font-bold'
                        : 'text-slate-600 hover:bg-emerald-50/80 hover:text-civic-forest active:shadow-soft-pressed'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isActive ? 'text-emerald-300' : 'text-slate-400'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Civic Assistance Card at Bottom of Sidebar */}
          <div className="pt-4 border-t border-emerald-900/10 mt-6 space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 shadow-soft-inset space-y-1.5">
              <div className="flex items-center space-x-1.5 text-civic-forest font-bold text-[11px] uppercase tracking-wider">
                <PhoneCall className="w-3.5 h-3.5 text-civic-emerald" />
                <span>Barangay Desk</span>
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Hotline: (043) 756-1234
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Brgy. Sabang Solid Waste Management Office &bull; Lipa City
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 min-w-0 bg-[#F4F7F5]/40 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
