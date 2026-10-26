import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ResidentProfilePage from '@/app/resident/profile/page';
import * as apiClient from '@/lib/api-client';
import * as authContext from '@/lib/auth-context';

describe('ResidentProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 1,
        email: 'resident.demo@sabtrack.local',
        full_name: 'Faith A. Valencia',
        role: 'RESIDENT',
        is_active: true,
        area_id: 2,
        created_at: '2026-01-15T08:00:00Z',
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

    vi.spyOn(apiClient, 'getMyPointsSummary').mockResolvedValue({
      total_points: 240,
      tier: 'Green Champion',
      verified_activities_count: 5,
      ledger_history: [],
      recent_claims: [],
    });

    vi.spyOn(apiClient, 'getMyReports').mockResolvedValue({
      items: [
        {
          id: 1,
          user_id: 1,
          area_id: 2,
          report_type: 'ILLEGAL_DUMPING',
          description: 'Accumulated waste near canal',
          photo_url: null,
          status: 'RESOLVED',
          resolution_notes: 'Waste collected by truck team',
          is_demo_data: true,
          created_at: '2026-02-10T00:00:00Z',
          updated_at: '2026-02-11T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          area_id: 2,
          report_type: 'MISSED_COLLECTION',
          description: 'Biodegradable bin was skipped',
          photo_url: null,
          status: 'SUBMITTED',
          resolution_notes: null,
          is_demo_data: true,
          created_at: '2026-02-20T00:00:00Z',
          updated_at: '2026-02-20T00:00:00Z',
        },
      ],
      total: 2,
    });
  });

  it('renders resident identity header, citizen ID, and verified status', async () => {
    render(<ResidentProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Faith A. Valencia' })).toBeInTheDocument();
    });

    expect(screen.getAllByText(/resident\.demo@sabtrack\.local/).length).toBeGreaterThan(0);
    expect(screen.getByText('Verified Citizen')).toBeInTheDocument();
    expect(screen.getByText('ID: SAB-2026-0001')).toBeInTheDocument();
    expect(screen.getByText(/Barangay Sabang, Lipa City, 4217/)).toBeInTheDocument();
    expect(screen.getByText('Citizen in Good Standing')).toBeInTheDocument();
  });

  it('renders dynamic KPI metrics from points summary and reports track record', async () => {
    render(<ResidentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('240')).toBeInTheDocument();
      expect(screen.getByText(/Tier: Green Champion/)).toBeInTheDocument();
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/1 Resolved • 1 Active/)).toBeInTheDocument();
    expect(screen.getByText('98.5%')).toBeInTheDocument();
  });

  it('renders detailed household demographics and collection route details', async () => {
    render(<ResidentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/Purok 2 - Maharlika \(Area ID #2\)/)).toBeInTheDocument();
    });

    expect(screen.getByText(/4 Registered Family Members/)).toBeInTheDocument();
    expect(screen.getByText(/Waste Generation Classification/)).toBeInTheDocument();
    expect(screen.getByText(/Route A • Bio/)).toBeInTheDocument();
  });

  it('renders contact information, emergency desk, and civic hotlines', async () => {
    render(<ResidentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Mobile SMS Hotline Number')).toBeInTheDocument();
    });

    expect(screen.getByText(/\+63 917 890 1234/)).toBeInTheDocument();
    expect(screen.getByText(/\(043\) 756-1234/)).toBeInTheDocument();
  });

  it('renders civic eco-badges and community recognitions', async () => {
    render(<ResidentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Model Segregator 2026')).toBeInTheDocument();
    });

    expect(screen.getByText('Vigilant Citizen')).toBeInTheDocument();
    expect(screen.getByText('Organic Composter')).toBeInTheDocument();
    expect(screen.getByText('Bayanihan Volunteer')).toBeInTheDocument();
    expect(screen.getByText('4 Badges Earned')).toBeInTheDocument();
  });

  it('renders RA 10173 data privacy compliance and EXIF GPS scrubbing assurance', async () => {
    render(<ResidentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('RA 10173 Compliance')).toBeInTheDocument();
    });

    expect(screen.getByText('EXIF GPS Sanitization')).toBeInTheDocument();
    expect(screen.getByText('Session & CSRF Defense')).toBeInTheDocument();
    expect(screen.getByText(/dpo@sabang-lipa\.gov\.ph/)).toBeInTheDocument();
  });

  it('opens edit modal, updates contact number and preferences, and displays confirmation toast', async () => {
    render(<ResidentProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Edit Details/i })).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Edit Details/i });
    fireEvent.click(editBtn);

    expect(screen.getByText('Edit Resident Profile')).toBeInTheDocument();

    const phoneInput = screen.getByPlaceholderText('+63 9XX XXX XXXX');
    fireEvent.change(phoneInput, { target: { value: '+63 999 111 2222' } });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Residency preferences and notification settings have been updated successfully!/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText('+63 999 111 2222')).toBeInTheDocument();
  });
});
