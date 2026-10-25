import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import AdminUsersPage from '@/app/admin/users/page';
import * as authContext from '@/lib/auth-context';
import * as apiClient from '@/lib/api-client';
import { UserListResponse } from '@/types/users';

const mockUsersData: UserListResponse = {
  items: [
    {
      id: 3,
      email: 'admin.demo@sabtrack.local',
      full_name: 'Barangay Captain Admin',
      role: 'BARANGAY_ADMIN',
      area_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      email: 'staff.demo@sabtrack.local',
      full_name: 'Kagawad Staff Officer',
      role: 'BARANGAY_STAFF',
      area_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 1,
      email: 'resident.demo@sabtrack.local',
      full_name: 'Citizen Resident',
      role: 'RESIDENT',
      area_id: 1,
      is_active: false,
      created_at: new Date().toISOString(),
    },
  ],
  total: 3,
};

describe('AdminUsersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 3,
        email: 'admin.demo@sabtrack.local',
        role: 'BARANGAY_ADMIN',
        full_name: 'Barangay Captain Admin',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      permissions: ['users:manage'],
      loading: false,
      error: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn().mockReturnValue(true),
      hasRole: vi.fn().mockImplementation((role) => role === 'BARANGAY_ADMIN'),
      refreshSession: vi.fn(),
    });
  });

  it('renders user directory and KPI statistics', async () => {
    vi.spyOn(apiClient, 'getUsers').mockResolvedValueOnce(mockUsersData);

    render(<AdminUsersPage />);

    expect(screen.getByText(/User & Personnel Governance/i)).toBeInTheDocument();
    expect(screen.getByText(/Provision Account/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Barangay Captain Admin')).toBeInTheDocument();
      expect(screen.getByText('Kagawad Staff Officer')).toBeInTheDocument();
      expect(screen.getByText('Citizen Resident')).toBeInTheDocument();
    });
  });

  it('handles user status toggle and recognizes active/deactivated badges', async () => {
    vi.spyOn(apiClient, 'getUsers').mockResolvedValue(mockUsersData);
    const mockUpdateStatus = vi.spyOn(apiClient, 'updateUserStatus').mockResolvedValue({
      id: 1,
      email: 'resident.demo@sabtrack.local',
      full_name: 'Citizen Resident',
      role: 'RESIDENT',
      area_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    // Mock confirm dialog
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Reactivate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reactivate'));

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith(1, true);
    });
  });
});
