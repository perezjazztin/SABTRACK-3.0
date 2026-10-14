'use client';

import React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
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
      <div className="flex flex-col md:flex-row gap-6">
        {/* Administrative Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-civic-border p-4 shadow-sm sticky top-20 space-y-4">
            <div className="px-2 py-1">
              <div className="flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-civic-forest" />
                <span className="text-[11px] font-bold text-civic-forest uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Barangay Sabang Governance
              </p>
            </div>

            <nav className="space-y-1">
              {ADMIN_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const requiresAdmin = item.minRole === 'BARANGAY_ADMIN';
                const isPermitted = user?.role === 'BARANGAY_ADMIN' || !requiresAdmin;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-civic-slate text-white shadow-sm'
                        : isPermitted
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-civic-slate'
                        : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                    )}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>

                    {!isPermitted && (
                      <span className="inline-flex items-center text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded font-mono">
                        <Lock className="w-2.5 h-2.5 mr-0.5" />
                        Admin
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 min-w-0">{children}</section>
      </div>
    </ProtectedRoute>
  );
}
