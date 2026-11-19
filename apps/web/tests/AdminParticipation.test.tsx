import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import AdminParticipationPage from '@/app/admin/participation/page';
import * as authContext from '@/lib/auth-context';
import * as apiClient from '@/lib/api-client';
import { ClaimItem } from '@/types/gamification';

vi.mock('@/lib/use-realtime-sync', () => ({
  useRealtimeSync: vi.fn(),
}));

const segregationClaim = {
  id: 17,
  resident_id: 10,
  resident_name: 'Resident Demo',
  activity_title: 'Sorted recyclables',
  description: 'Sorted and prepared recyclable household waste.',
  activity_type: 'SEGREGATION',
  points_requested: 250,
  status: 'PENDING',
  reviewed_by_name: null,
  review_notes: null,
  reviewed_at: null,
  created_at: '2026-11-01T00:00:00Z',
} as ClaimItem;

const authValue = {
  user: {
    id: 'staff-1',
    email: 'staff.demo@sabtrack.local',
    full_name: 'Barangay Staff',
    role: 'BARANGAY_STAFF' as const,
    is_active: true,
  },
  permissions: ['participation:review'],
  isAuthenticated: true,
  loading: false,
  isLoggingOut: false,
  login: vi.fn(),
  logout: vi.fn(),
  hasRole: (roles: string | string[]) =>
    (Array.isArray(roles) ? roles : [roles]).includes('BARANGAY_STAFF'),
  hasPermission: () => true,
  refreshSession: vi.fn(),
};

describe('AdminParticipationPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authContext, 'useAuth').mockReturnValue(authValue);
    vi.spyOn(apiClient, 'getAllClaims').mockResolvedValue([segregationClaim]);
    vi.spyOn(apiClient, 'getInitiatives').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the structured claim type and a fixed 25-point segregation award for review', async () => {
    const reviewClaim = vi.spyOn(apiClient, 'reviewClaim').mockResolvedValue({
      ...segregationClaim,
      status: 'APPROVED',
    });
    render(<AdminParticipationPage />);

    await screen.findByText('Sorted recyclables');
    expect(screen.getByText('25 pts fixed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    const dialog = screen.getByRole('dialog', { name: 'Verify Participation Claim #17' });
    expect(dialog).toHaveTextContent('SEGREGATION');
    expect(within(dialog).getByText(/fixed 25-point award/i)).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Points to Award upon Approval')).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve & Issue Points' }));
    await waitFor(() => {
      expect(reviewClaim).toHaveBeenCalled();
    });
    expect(reviewClaim.mock.calls[0][0]).toBe(17);
    expect(reviewClaim.mock.calls[0][1]).toEqual({
      status: 'APPROVED',
      review_notes: undefined,
    });
    expect(reviewClaim.mock.calls[0][1]).not.toHaveProperty('points_awarded');
  });
});
