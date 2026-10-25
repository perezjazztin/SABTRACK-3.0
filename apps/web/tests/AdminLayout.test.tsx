import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AdminLayout, { ADMIN_NAV } from '@/app/admin/layout';
import * as authContext from '@/lib/auth-context';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('AdminLayout Component Role & View-Only Nav Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Collection Schedules, Analytics & Insights, and User Management as permitted with "View Only" indicator for BARANGAY_STAFF', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'staff-1',
        email: 'staff.demo@sabtrack.local',
        full_name: 'Kagawad Staff',
        role: 'BARANGAY_STAFF',
        is_active: true,
      },
      permissions: ['reports:review', 'participation:review', 'analytics:read', 'users:read'],
      isAuthenticated: true,
      loading: false,
      isLoggingOut: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: (roles) => {
        const list = Array.isArray(roles) ? roles : [roles];
        return list.includes('BARANGAY_STAFF');
      },
      hasPermission: () => true,
      refreshSession: vi.fn(),
    });

    render(
      <AdminLayout>
        <div data-testid="admin-content">Staff Dashboard Content</div>
      </AdminLayout>
    );

    // Verify children render
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();

    // Verify Collection Schedules exists in ADMIN_NAV with minRole: BARANGAY_STAFF
    const schedulesNav = ADMIN_NAV.find((item) => item.href === '/admin/schedules');
    expect(schedulesNav?.minRole).toBe('BARANGAY_STAFF');
    expect((schedulesNav as any)?.viewOnlyForStaff).toBe(true);

    // Verify Analytics exists in ADMIN_NAV with minRole: BARANGAY_STAFF
    const analyticsNav = ADMIN_NAV.find((item) => item.href === '/admin/analytics');
    expect(analyticsNav?.minRole).toBe('BARANGAY_STAFF');
    expect((analyticsNav as any)?.viewOnlyForStaff).toBe(true);

    // Verify User Management exists in ADMIN_NAV with minRole: BARANGAY_STAFF
    const usersNav = ADMIN_NAV.find((item) => item.href === '/admin/users');
    expect(usersNav?.minRole).toBe('BARANGAY_STAFF');
    expect((usersNav as any)?.viewOnlyForStaff).toBe(true);

    // Verify "View Only" badges are rendered for staff
    const viewOnlyBadges = screen.getAllByText('View Only');
    expect(viewOnlyBadges.length).toBeGreaterThanOrEqual(3);
  });

  it('renders all administrative modules without "View Only" badge for BARANGAY_ADMIN', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin.demo@sabtrack.local',
        full_name: 'Barangay Captain Admin',
        role: 'BARANGAY_ADMIN',
        is_active: true,
      },
      permissions: ['schedules:manage', 'analytics:read', 'users:manage', 'users:read'],
      isAuthenticated: true,
      loading: false,
      isLoggingOut: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: (roles) => {
        const list = Array.isArray(roles) ? roles : [roles];
        return list.includes('BARANGAY_ADMIN');
      },
      hasPermission: () => true,
      refreshSession: vi.fn(),
    });

    render(
      <AdminLayout>
        <div data-testid="admin-content">Admin Dashboard Content</div>
      </AdminLayout>
    );

    // For full admin, "View Only" badge should NOT appear
    expect(screen.queryByText('View Only')).not.toBeInTheDocument();
  });
});
