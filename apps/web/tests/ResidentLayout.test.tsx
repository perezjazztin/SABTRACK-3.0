import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ResidentLayout, { RESIDENT_NAV } from '@/app/resident/layout';

// Mock auth context
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'res-123',
      email: 'resident.demo@sabtrack.local',
      full_name: 'Faith Valencia',
      role: 'RESIDENT',
      is_active: true,
    },
    loading: false,
    isAuthenticated: true,
    hasRole: () => true,
    hasPermission: () => true,
    refreshSession: vi.fn(),
  }),
}));

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

  it('contains accessible navigation landmark and portal header', () => {
    render(
      <ResidentLayout>
        <div>Content</div>
      </ResidentLayout>
    );

    expect(
      screen.getByRole('navigation', { name: /Resident Portal Navigation/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Resident Portal')).toBeInTheDocument();
    expect(screen.getByText('Community Services')).toBeInTheDocument();
  });
});
