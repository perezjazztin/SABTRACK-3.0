import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import ResidentSchedulesPage from '@/app/resident/schedules/page';
import * as apiClient from '@/lib/api-client';
import * as authContext from '@/lib/auth-context';

vi.mock('@/lib/use-realtime-sync', () => ({
  useRealtimeSync: vi.fn(),
}));

describe('ResidentSchedulesPage', () => {
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

    vi.spyOn(apiClient, 'getSchedules').mockResolvedValue({
      items: [
        {
          id: 101,
          area_id: 2,
          area_name: 'Sector 1 (Monday & Thursday)',
          day_of_week: 'MONDAY',
          waste_type: 'BIODEGRADABLE',
          start_time: '06:00:00',
          end_time: '09:00:00',
          notes: 'Place green bags curbside before 6 AM',
          is_active: true,
          is_demo_data: true,
          created_at: '2026-10-25T00:00:00Z',
          updated_at: '2026-10-25T00:00:00Z',
        },
        {
          id: 102,
          area_id: 3,
          area_name: 'Sector 2 (Tuesday & Friday)',
          day_of_week: 'TUESDAY',
          waste_type: 'RECYCLABLE',
          start_time: '08:00:00',
          end_time: '11:00:00',
          notes: 'Dry and clean paper and plastics',
          is_active: true,
          is_demo_data: true,
          created_at: '2026-10-25T00:00:00Z',
          updated_at: '2026-10-25T00:00:00Z',
        },
        {
          id: 103,
          area_id: 4,
          area_name: 'Sector 3 (Wednesday & Saturday)',
          day_of_week: 'SATURDAY',
          waste_type: 'RECYCLABLE',
          start_time: '08:00:00',
          end_time: '11:00:00',
          notes: 'Dry and clean paper and plastics',
          is_active: true,
          is_demo_data: true,
          created_at: '2026-10-25T00:00:00Z',
          updated_at: '2026-10-25T00:00:00Z',
        },
      ],
      total: 3,
    });

  });

  it('renders the collection schedule table view by default with columns and rows', async () => {
    render(<ResidentSchedulesPage />);

    fireEvent.click(screen.getByRole('button', { name: /Show all sectors/i }));

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByText(/Loading collection timetable/i)).not.toBeInTheDocument();
    });

    const table = screen.getByRole('table');

    // Check table headers (clean resident-friendly layout without clutter column)
    expect(screen.getByRole('columnheader', { name: /Day & time/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Waste type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Purok \/ sector/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Reminder/i })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /Pickup notes/i })).not.toBeInTheDocument();

    // Check table rows inside table
    expect(within(table).getByText('Monday')).toBeInTheDocument();
    expect(within(table).getByText('6:00 AM – 9:00 AM')).toBeInTheDocument();
    expect(within(table).getByText(/Biodegradable \(Nabubulok\)/i)).toBeInTheDocument();
    expect(within(table).getByText('Sector 1')).toBeInTheDocument();
    expect(within(table).getByText('Sector 2')).toBeInTheDocument();
    expect(within(table).getByText('Sector 3')).toBeInTheDocument();
    expect(within(table).queryByText(/Sector [123] \(/)).not.toBeInTheDocument();
    expect(within(table).getByText('Tuesday')).toBeInTheDocument();
    expect(within(table).getByText('Saturday')).toBeInTheDocument();
    expect(within(table).getAllByText('8:00 AM – 11:00 AM')).toHaveLength(2);
    expect(within(table).getAllByText(/Recyclable \(Mareresiklo\)/i)).toHaveLength(2);

    // Check Notify Me buttons
    const notifyButtons = screen.getAllByRole('button', { name: /Notify Me/i });
    expect(notifyButtons.length).toBeGreaterThan(0);
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

    fireEvent.click(screen.getByRole('button', { name: /Show all sectors/i }));

    // Click Notify Me on first schedule
    const firstNotifyBtn = screen.getAllByRole('button', { name: /Notify Me/i })[0];
    fireEvent.click(firstNotifyBtn);

    // Modal should be visible and include pickup guidelines
    expect(screen.getByRole('dialog', { name: /Collection reminder/i })).toBeInTheDocument();
    expect(screen.getByText(/Pickup Guidelines & Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Place green bags curbside before 6 AM/i)).toBeInTheDocument();
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
    const cardGridBtn = screen.getByRole('tab', { name: /By sector/i });
    fireEvent.click(cardGridBtn);

    // Table should not be rendered
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sector 2' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sector 3' })).toBeInTheDocument();

    // Switch back to Table View
    const tableBtn = screen.getByRole('tab', { name: /Timetable/i });
    fireEvent.click(tableBtn);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('updates the pickup summary when a resident changes their location', async () => {
    render(<ResidentSchedulesPage />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const locationSelector = screen.getByLabelText(/Your street or subdivision/i);
    expect(locationSelector).toHaveValue('Monte Claro');

    fireEvent.change(locationSelector, { target: { value: 'General Luna St.' } });

    expect(screen.getByText(/General Luna St\., General Luna St\./i)).toBeInTheDocument();
    expect(screen.getAllByText('6:00 AM – 9:00 AM').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Show all sectors/i }));
    expect(screen.getByRole('heading', { name: /Barangay Sabang.*All sectors/i })).toBeInTheDocument();
  });
});
