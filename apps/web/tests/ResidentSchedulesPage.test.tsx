import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import ResidentSchedulesPage from '@/app/resident/schedules/page';
import * as apiClient from '@/lib/api-client';
import * as authContext from '@/lib/auth-context';

describe('ResidentSchedulesPage Component Table View & Email Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'resident.test@sabtrack.local',
        full_name: 'Faith Valencia',
        role: 'RESIDENT',
        is_active: true,
        area_id: 1,
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

    vi.spyOn(apiClient, 'getScheduleAreas').mockResolvedValue([
      { id: 1, code: 'PUROK-1', name: 'Purok 1 - Ilang-Ilang' },
      { id: 2, code: 'PUROK-2', name: 'Purok 2 - Sampaguita' },
    ]);

    vi.spyOn(apiClient, 'getSchedules').mockResolvedValue({
      items: [
        {
          id: 101,
          area_id: 1,
          area_name: 'Purok 1 - Ilang-Ilang',
          day_of_week: 'MONDAY',
          waste_type: 'BIODEGRADABLE',
          start_time: '06:00 AM',
          end_time: '09:00 AM',
          notes: 'Place green bags curbside before 6 AM',
          is_active: true,
          is_demo_data: true,
          created_at: '2026-10-25T00:00:00Z',
          updated_at: '2026-10-25T00:00:00Z',
        },
        {
          id: 102,
          area_id: 1,
          area_name: 'Purok 1 - Ilang-Ilang',
          day_of_week: 'WEDNESDAY',
          waste_type: 'RECYCLABLE',
          start_time: '08:00 AM',
          end_time: '11:00 AM',
          notes: 'Dry and clean paper and plastics',
          is_active: true,
          is_demo_data: true,
          created_at: '2026-10-25T00:00:00Z',
          updated_at: '2026-10-25T00:00:00Z',
        },
      ],
      total: 2,
    });

    vi.spyOn(apiClient, 'getAdvisories').mockResolvedValue({
      items: [],
      total: 0,
    });
  });

  it('renders the collection schedule table view by default with columns and rows', async () => {
    render(<ResidentSchedulesPage />);

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');

    // Check table headers
    expect(screen.getByRole('columnheader', { name: /Day & Time Window/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Waste Stream Category/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Purok \/ Sector/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Pickup Notes & Rules/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Email Reminder/i })).toBeInTheDocument();

    // Check table rows inside table
    expect(within(table).getByText('Monday')).toBeInTheDocument();
    expect(within(table).getByText('06:00 AM - 09:00 AM')).toBeInTheDocument();
    expect(within(table).getByText(/Biodegradable \(Nabubulok\)/i)).toBeInTheDocument();
    expect(within(table).getByText('Wednesday')).toBeInTheDocument();
    expect(within(table).getByText('08:00 AM - 11:00 AM')).toBeInTheDocument();
    expect(within(table).getByText(/Recyclable \(Mareresiklo\)/i)).toBeInTheDocument();

    // Check Notify Me buttons
    const notifyButtons = screen.getAllByRole('button', { name: /Notify Me/i });
    expect(notifyButtons.length).toBe(2);
  });

  it('opens reminder modal and registers email notification on submit', async () => {
    const notifyMock = vi.spyOn(apiClient, 'subscribeScheduleNotification').mockResolvedValue({
      message: 'Reminder notification registered! Automated reminder will be sent to resident.test@sabtrack.local.',
      schedule_id: 101,
      recipient_email: 'resident.test@sabtrack.local',
      day_of_week: 'MONDAY',
      waste_type: 'BIODEGRADABLE',
      collection_time: '06:00 AM - 09:00 AM',
      area_name: 'Purok 1 - Ilang-Ilang',
    });

    render(<ResidentSchedulesPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Notify Me/i }).length).toBeGreaterThan(0);
    });

    // Click Notify Me on first schedule
    const firstNotifyBtn = screen.getAllByRole('button', { name: /Notify Me/i })[0];
    fireEvent.click(firstNotifyBtn);

    // Modal should be visible
    expect(screen.getByText('Collection Reminder')).toBeInTheDocument();
    expect(screen.getByLabelText(/Notification Email Address/i)).toBeInTheDocument();

    // Submit the form
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Notify Me/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(notifyMock).toHaveBeenCalledWith(101, 'resident.test@sabtrack.local');
    });

    expect(await screen.findByText(/Reminder notification registered!/i)).toBeInTheDocument();
  });

  it('can toggle between Table View and Card Grid view', async () => {
    render(<ResidentSchedulesPage />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Switch to Card Grid view
    const cardGridBtn = screen.getByRole('button', { name: /Card Grid/i });
    fireEvent.click(cardGridBtn);

    // Table should not be rendered
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Switch back to Table View
    const tableBtn = screen.getByRole('button', { name: /Table View/i });
    fireEvent.click(tableBtn);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
