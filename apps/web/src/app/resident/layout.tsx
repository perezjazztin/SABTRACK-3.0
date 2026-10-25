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
      requiredRole="RESIDENT"
      moduleName="Resident Portal"
    >
      <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-4rem)] w-full">
        {/* Full-Height Sticky Neumorphic Sidebar Flush to Left Edge */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-[#edf2f7] border-r border-white/80 md:sticky md:top-16 md:h-[calc(100vh-4rem)] flex flex-col justify-between overflow-y-auto p-4 lg:p-5 shadow-[4px_0_14px_rgba(163,177,198,0.25)]">
          <div className="space-y-4">
            {/* Neumorphic Navigation Menu */}
            <nav className="space-y-2.5" aria-label="Resident Portal Navigation">
              {RESIDENT_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs transition-all duration-200',
                      isActive
                        ? 'bg-emerald-700 text-white shadow-neu-green font-bold border border-emerald-600/40'
                        : 'neu-btn-secondary text-slate-700 hover:text-emerald-800 hover:shadow-neu-raised font-semibold'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        isActive ? 'text-emerald-100' : 'text-slate-500 group-hover:text-emerald-700'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Neumorphic Civic Assistance Card at Bottom of Sidebar */}
          <div className="pt-4 border-t border-slate-300/60 mt-6 space-y-3">
            <div className="neu-card p-4 rounded-2xl shadow-neu-sm border border-white/80 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-[11px] uppercase tracking-wider">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-neu-xs">
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
        <section className="flex-1 min-w-0 bg-[#edf2f7] overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
