import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import AdminSchedulesPage from '@/app/admin/schedules/page';
import * as authContext from '@/lib/auth-context';
import * as apiClient from '@/lib/api-client';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/schedules',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockSchedules = [
  {
    id: 101,
    area_id: 1,
    area_name: 'Purok 1 Centro',
    day_of_week: 'MONDAY' as const,
    waste_type: 'BIODEGRADABLE' as const,
    start_time: '06:00 AM',
    end_time: '09:00 AM',
    notes: 'Green bins at curbside',
    is_active: true,
    created_at: '2026-10-25T08:00:00Z',
  },
];

const mockAdvisories = [
  {
    id: 201,
    area_id: 1,
    area_name: 'Purok 1 Centro',
    title: 'Truck 1 Hydraulic Maintenance Delay',
    message: 'Pickup moved to 1:00 PM due to truck servicing.',
    advisory_type: 'DELAY' as const,
    effective_date: '2026-10-26',
    is_active: true,
    created_at: '2026-10-25T09:00:00Z',
  },
];

const mockAreas = [
  { id: 1, code: 'PRK-01', name: 'Purok 1 Centro', description: 'Central sector' },
];

describe('AdminSchedulesPage Component Role & View-Only Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient, 'getSchedules').mockResolvedValue({
      items: mockSchedules,
      total: mockSchedules.length,
    });
    vi.spyOn(apiClient, 'getAdvisories').mockResolvedValue({
      items: mockAdvisories,
      total: mockAdvisories.length,
    });
    vi.spyOn(apiClient, 'getScheduleAreas').mockResolvedValue(mockAreas);
  });

  it('renders View-Only mode for BARANGAY_STAFF: displays timetables and advisories, hides edit/create/delete controls', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'staff-1',
        email: 'staff.demo@sabtrack.local',
        full_name: 'Kagawad Staff',
        role: 'BARANGAY_STAFF',
        is_active: true,
      },
      permissions: ['reports:review', 'participation:review'],
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

    render(<AdminSchedulesPage />);

    // Wait for timetable data to load
    await waitFor(() => {
      expect(screen.getByText('Purok 1 Centro')).toBeInTheDocument();
    });

    // Verify staff view-only banner is present
    expect(screen.getByText('Staff View-Only Access Mode')).toBeInTheDocument();
    expect(screen.getByText('Read-Only')).toBeInTheDocument();

    // Verify timetable content is visible to staff
    expect(screen.getByText('BIODEGRADABLE')).toBeInTheDocument();
    expect(screen.getByText('06:00 AM - 09:00 AM')).toBeInTheDocument();

    // Verify advisory is visible to staff
    expect(screen.getByText('Truck 1 Hydraulic Maintenance Delay')).toBeInTheDocument();

    // Verify mutative action buttons are NOT rendered for staff
    expect(screen.queryByText('Add Collection Slot')).not.toBeInTheDocument();
    expect(screen.queryByText('Broadcast Advisory')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Deactivate schedule')).not.toBeInTheDocument();

    // Verify table has "View Only" access chip in the action column
    expect(screen.getByText('Access')).toBeInTheDocument();
    expect(screen.getAllByText('View Only').length).toBeGreaterThanOrEqual(1);
  });

  it('renders full management controls for BARANGAY_ADMIN: Add Slot, Broadcast Advisory, and Deactivate buttons', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin.demo@sabtrack.local',
        full_name: 'Barangay Captain Admin',
        role: 'BARANGAY_ADMIN',
        is_active: true,
      },
      permissions: ['schedules:manage'],
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

    render(<AdminSchedulesPage />);

    await waitFor(() => {
      expect(screen.getByText('Purok 1 Centro')).toBeInTheDocument();
    });

    // Staff view-only banner must NOT be rendered for admin
    expect(screen.queryByText('Staff View-Only Access Mode')).not.toBeInTheDocument();

    // Admin authorization subtitle
    expect(screen.getByText('Barangay Admin Authorization')).toBeInTheDocument();

    // Admin action buttons MUST be present
    expect(screen.getByText('Add Collection Slot')).toBeInTheDocument();
    expect(screen.getByText('Broadcast Advisory')).toBeInTheDocument();
    expect(screen.getByTitle('Deactivate schedule')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
