import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Header } from '@/components/Header';
import * as authContext from '@/lib/auth-context';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Header Component Navigation & Role Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HOME, ABOUT, CONTACT US, and LOGIN when user is NOT logged in', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<Header />);

    // Public links must be visible
    expect(screen.getByRole('link', { name: /^HOME$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^ABOUT$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^CONTACT US$/i })).toBeInTheDocument();

    // Register & Login must be visible
    expect(screen.getByRole('link', { name: /LOGIN/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /REGISTER/i })).toBeInTheDocument();
  });

  it('when logged in as RESIDENT: only shows Resident Portal description and prevents portal switching', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'res-1',
        email: 'resident.demo@sabtrack.local',
        full_name: 'Faith Valencia',
        role: 'RESIDENT',
        is_active: true,
      },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<Header />);

    // Public links removed
    expect(screen.queryByRole('link', { name: /^HOME$/i })).not.toBeInTheDocument();

    // Resident Portal must be present
    expect(screen.getByRole('link', { name: /Resident Portal/i })).toBeInTheDocument();

    // Must NOT be able to switch to Admin Console
    expect(screen.queryByRole('link', { name: /Admin Console/i })).not.toBeInTheDocument();

    // No redundant standalone "RESIDENT" badge
    expect(screen.queryByText(/^RESIDENT$/i)).not.toBeInTheDocument();

    // Sign out button must be present
    expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument();
  });

  it('when logged in as BARANGAY_ADMIN: only shows Admin Console description and prevents portal switching', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin.demo@sabtrack.local',
        full_name: 'Admin User',
        role: 'BARANGAY_ADMIN',
        is_active: true,
      },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<Header />);

    // Admin Console must be present
    expect(screen.getByRole('link', { name: /Admin Console/i })).toBeInTheDocument();

    // Must NOT be able to switch to Resident Portal
    expect(screen.queryByRole('link', { name: /Resident Portal/i })).not.toBeInTheDocument();

    // Sign out button must be present
    expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument();
  });

  it('when logged in as BARANGAY_STAFF: only shows Admin Console description and prevents portal switching', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'staff-1',
        email: 'staff.demo@sabtrack.local',
        full_name: 'Staff Reviewer',
        role: 'BARANGAY_STAFF',
        is_active: true,
      },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<Header />);

    // Admin Console must be present
    expect(screen.getByRole('link', { name: /Admin Console/i })).toBeInTheDocument();

    // Must NOT be able to switch to Resident Portal
    expect(screen.queryByRole('link', { name: /Resident Portal/i })).not.toBeInTheDocument();

    // Sign out button must be present
    expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument();
  });

  it('when logged in as SYSTEM_MAINTAINER: only shows System Maintainer description, no portal switching', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'maint-1',
        email: 'maintainer.demo@sabtrack.local',
        full_name: 'Maintainer Demo',
        role: 'SYSTEM_MAINTAINER',
        is_active: true,
      },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<Header />);

    // System Maintainer badge must be present
    expect(screen.getByText(/System Maintainer/i)).toBeInTheDocument();

    // Must NOT see Resident Portal or Admin Console
    expect(screen.queryByRole('link', { name: /Resident Portal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Admin Console/i })).not.toBeInTheDocument();

    // Sign out button must be present
    expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument();
  });

  it('navigates automatically to the home page (/) upon signing out', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'res-1',
        email: 'resident.demo@sabtrack.local',
        full_name: 'Faith Valencia',
        role: 'RESIDENT',
        is_active: true,
      },
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      hasRole: vi.fn(),
      hasPermission: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<Header />);

    const signOutBtn = screen.getByRole('button', { name: /SIGN OUT/i });
    expect(signOutBtn).toBeInTheDocument();

    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
