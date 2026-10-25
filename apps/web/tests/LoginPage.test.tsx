import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import LoginPage from '@/app/login/page';
import * as authContext from '@/lib/auth-context';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginPage Role-Based Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects BARANGAY_STAFF to /admin on login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      id: 2,
      email: 'staff.demo@sabtrack.local',
      role: 'BARANGAY_STAFF',
      full_name: 'Demo Staff',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'staff.demo@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'SabtrackDevPass2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'staff.demo@sabtrack.local',
        password: 'SabtrackDevPass2026!',
      });
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('redirects BARANGAY_ADMIN to /admin on login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      id: 3,
      email: 'admin.demo@sabtrack.local',
      role: 'BARANGAY_ADMIN',
      full_name: 'Demo Admin',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'admin.demo@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'SabtrackDevPass2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('redirects RESIDENT to /resident on login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      id: 1,
      email: 'resident.demo@sabtrack.local',
      role: 'RESIDENT',
      full_name: 'Demo Resident',
      is_active: true,
      created_at: new Date().toISOString(),
    });

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: null,
      permissions: [],
      loading: false,
      error: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: vi.fn(),
      hasPermission: vi.fn(),
      hasRole: vi.fn(),
      refreshSession: vi.fn(),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Account Email/i), {
      target: { value: 'resident.demo@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'SabtrackDevPass2026!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/resident');
    });
  });
});
