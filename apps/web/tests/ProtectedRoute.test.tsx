import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import * as authContext from '@/lib/auth-context';

describe('ProtectedRoute Component Role Enforcement & Switch Account', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { location: unknown }).location;
    window.location = { ...originalLocation, href: '' } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('renders children when user role satisfies requiredRole', () => {
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
      isLoggingOut: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn().mockReturnValue(true),
      hasPermission: vi.fn().mockReturnValue(true),
      refreshSession: vi.fn(),
    });

    render(
      <ProtectedRoute requiredRole="BARANGAY_ADMIN" moduleName="Admin Schedules">
        <div>Protected Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Admin Content')).toBeInTheDocument();
  });

  it('when role is insufficient: renders 403 and directs switch account to /register instead of portal overview', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'staff-1',
        email: 'staff.demo@sabtrack.local',
        full_name: 'Staff User',
        role: 'BARANGAY_STAFF',
        is_active: true,
      },
      isAuthenticated: true,
      loading: false,
      isLoggingOut: false,
      login: vi.fn(),
      logout: mockLogout,
      hasRole: vi.fn().mockReturnValue(false),
      hasPermission: vi.fn().mockReturnValue(true),
      refreshSession: vi.fn(),
    });

    render(
      <ProtectedRoute requiredRole="RESIDENT" moduleName="Resident Services">
        <div>Protected Resident Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/403 — Access Forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/staff\.demo@sabtrack\.local/i)).toBeInTheDocument();

    const switchBtn = screen.getByRole('button', { name: /Switch Account/i });
    expect(switchBtn).toBeInTheDocument();

    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      // Confirms redirection directly to /register for the supposed account, not to overview (/admin)
      expect(window.location.href).toBe('/register');
      expect(window.location.href).not.toBe('/admin');
    });
  });
});
