'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const RESIDENT_NAV = [
  { label: 'Dashboard', href: '/resident', icon: LayoutDashboard },
  { label: 'Collection Schedules', href: '/resident/schedules', icon: Calendar },
  { label: 'My Reports', href: '/resident/reports', icon: FileText },
  { label: 'SAB-Points', href: '/resident/points', icon: Award },
  { label: 'Announcements', href: '/resident/announcements', icon: Bell },
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-civic-border p-4 shadow-sm sticky top-20 space-y-4">
            <div className="px-2 py-1">
              <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider flex items-center">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-civic-emerald" />
                Resident Portal
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Community Services</p>
            </div>

            <nav className="space-y-1">
              {RESIDENT_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-civic-forest text-white shadow-sm'
                        : 'text-slate-600 hover:bg-emerald-50 hover:text-civic-forest'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </ProtectedRoute>
  );
}
