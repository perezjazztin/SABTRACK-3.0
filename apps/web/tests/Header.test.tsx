import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Header } from '@/components/Header';
import * as authContext from '@/lib/auth-context';

describe('Header Component Navigation & Authentication States', () => {
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

  it('removes HOME, ABOUT, CONTACT US, and Demo Resident identity chip once logged in', () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'res-1',
        email: 'resident.demo@sabtrack.local',
        full_name: 'Demo Resident (Fictional)',
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

    // Public links must be REMOVED once logged in
    expect(screen.queryByRole('link', { name: /^HOME$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^ABOUT$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^CONTACT US$/i })).not.toBeInTheDocument();

    // "Demo Resident (Fictional)" must NOT be displayed
    expect(screen.queryByText(/Demo Resident \(Fictional\)/i)).not.toBeInTheDocument();

    // Portal link and Sign Out must be present
    expect(screen.getByRole('link', { name: /Resident Portal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SIGN OUT/i })).toBeInTheDocument();
  });
});
