import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ResidentLayout, { RESIDENT_NAV } from '@/app/resident/layout';
import * as authContext from '@/lib/auth-context';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/resident',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('ResidentLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 123,
        email: 'resident.demo@sabtrack.local',
        full_name: 'Faith Valencia',
        role: 'RESIDENT',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      permissions: [],
      error: null,
      loading: false,
      isAuthenticated: true,
      hasRole: (roles) => {
        const list = Array.isArray(roles) ? roles : [roles];
        return list.includes('RESIDENT');
      },
      hasPermission: () => true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshSession: vi.fn(),
    });
  });

  it('renders all 7 resident portal navigation items with correct links', () => {
    render(
      <ResidentLayout>
        <div data-testid="child-content">Resident Dashboard Body</div>
      </ResidentLayout>
    );

    // Verify children render
    expect(screen.getByTestId('child-content')).toBeInTheDocument();

    // Verify all 7 nav labels and hrefs
    expect(RESIDENT_NAV).toHaveLength(7);

    const expectedItems = [
      { label: 'Dashboard', href: '/resident' },
      { label: 'Collection Schedules', href: '/resident/schedules' },
      { label: 'My Reports', href: '/resident/reports' },
      { label: 'SAB-Points', href: '/resident/points' },
      { label: 'Announcements', href: '/resident/announcements' },
      { label: 'AwarenessHub', href: '/resident/awareness' },
      { label: 'Profile', href: '/resident/profile' },
    ];

    expectedItems.forEach(({ label, href }) => {
      const link = screen.getByRole('link', { name: new RegExp(label, 'i') });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('contains accessible navigation landmark and excludes redundant portal header', () => {
    render(
      <ResidentLayout>
        <div>Content</div>
      </ResidentLayout>
    );

    expect(
      screen.getByRole('navigation', { name: /Resident Portal Navigation/i })
    ).toBeInTheDocument();

    // Redundant sidebar headers should NOT be present (since header already indicates portal/identity)
    expect(screen.queryByText('Community Services')).not.toBeInTheDocument();
  });

  it('toggles mobile portal navigation drawer via the three horizontal lines button', () => {
    render(
      <ResidentLayout>
        <div>Content</div>
      </ResidentLayout>
    );

    // Three horizontal lines hamburger button is present
    const toggleBtn = screen.getByRole('button', { name: /Toggle portal navigation/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    // Mobile nav drawer is initially closed
    expect(screen.queryByRole('navigation', { name: /Mobile Resident Portal Navigation/i })).not.toBeInTheDocument();

    // Click hamburger button to open
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: /Mobile Resident Portal Navigation/i })).toBeInTheDocument();

    // Click again to close
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: /Mobile Resident Portal Navigation/i })).not.toBeInTheDocument();
  });

  it('renders the minimal modern DashboardFooter at the bottom of the content area', () => {
    render(
      <ResidentLayout>
        <div>Content</div>
      </ResidentLayout>
    );

    expect(screen.getByTestId('dashboard-footer')).toBeInTheDocument();
    expect(screen.getByText('SABTRACK')).toBeInTheDocument();
    expect(screen.getByText('v3.0.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Help & Support dialog/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Privacy Policy dialog/i })).toBeInTheDocument();
  });
});
