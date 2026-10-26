import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ResidentReportsPage from '@/app/resident/reports/page';
import * as apiClient from '@/lib/api-client';
import { WasteReport } from '@/types/reports';

vi.mock('@/lib/use-realtime-sync', () => ({
  useRealtimeSync: vi.fn(),
}));

const mockReports: WasteReport[] = [
  {
    id: 1,
    resident_id: 10,
    resident_name: 'Faith Valencia',
    category: 'UNCOLLECTED_GARBAGE',
    title: 'Uncollected Bags on Corner',
    description: 'Three large bags sitting on the street corner since yesterday morning.',
    location_text: 'Sitio Sampaguita, corner Main St',
    area_id: 1,
    area_name: 'Purok 1',
    latitude: null,
    longitude: null,
    photo_url: '/api/v1/uploads/test-evidence-1.jpg',
    status: 'SUBMITTED',
    admin_notes: null,
    is_demo_data: true,
    created_at: '2026-10-25T08:00:00Z',
    updated_at: '2026-10-25T08:00:00Z',
    status_history: [
      {
        id: 1,
        previous_status: null,
        new_status: 'SUBMITTED',
        changed_by_name: 'Faith Valencia',
        changed_by_role: 'RESIDENT',
        remarks: 'Report initially submitted by resident.',
        created_at: '2026-10-25T08:00:00Z',
      },
    ],
  },
];

describe('ResidentReportsPage Mandatory Photo Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient, 'getMyReports').mockResolvedValue({
      items: mockReports,
      total: mockReports.length,
    });
  });

  it('renders submitted reports and displays attached photo link', async () => {
    render(<ResidentReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Uncollected Bags on Corner')).toBeInTheDocument();
      expect(screen.getByText('View Attached Evidence Photo')).toBeInTheDocument();
    });
  });

  it('opens submission form and indicates that photo evidence is required', async () => {
    render(<ResidentReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Submit New Report')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit New Report'));

    expect(screen.getByText('New Waste Incident Report')).toBeInTheDocument();
    expect(screen.getByText(/Incident Photo Evidence \*/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Kinakailangan ang larawan bilang patunay ng insidente bago ma-submit/i)
    ).toBeInTheDocument();

    // Submit button should be disabled when no photo has been attached
    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    expect(submitBtn).toBeDisabled();
  });

  it('allows submission when photo is uploaded and validates required fields', async () => {
    const createdReport: WasteReport = {
      id: 2,
      resident_id: 10,
      resident_name: 'Faith Valencia',
      category: 'ILLEGAL_DUMPING',
      title: 'Dumping near creek bed',
      description: 'Multiple sacks of commercial debris left overnight near the bridge.',
      location_text: 'Bridge, Purok 2',
      area_id: 2,
      area_name: 'Purok 2',
      latitude: null,
      longitude: null,
      photo_url: '/api/v1/uploads/evidence-photo-999.jpg',
      status: 'SUBMITTED',
      admin_notes: null,
      is_demo_data: true,
      created_at: '2026-10-26T09:00:00Z',
      updated_at: '2026-10-26T09:00:00Z',
      status_history: [],
    };

    const createSpy = vi.spyOn(apiClient, 'createReport').mockResolvedValueOnce(createdReport);
    vi.spyOn(apiClient, 'uploadEvidencePhoto').mockResolvedValueOnce({
      file_url: '/api/v1/uploads/evidence-photo-999.jpg',
      filename: 'evidence-photo-999.jpg',
    });

    const { container } = render(<ResidentReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Submit New Report')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Submit New Report'));

    // Fill textual fields
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Sitio Sampaguita/i), {
      target: { value: 'Bridge, Purok 2' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Uncollected garbage bags/i), {
      target: { value: 'Dumping near creek bed' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe what waste is present/i), {
      target: { value: 'Multiple sacks of commercial debris left overnight near the bridge.' },
    });

    // Upload file
    const file = new File(['dummy-image-bytes'], 'creek-dumping.jpg', { type: 'image/jpeg' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Photo Uploaded & Sanitized/i)).toBeInTheDocument();
    });

    // Submit button should now be enabled
    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        category: 'UNCOLLECTED_GARBAGE',
        title: 'Dumping near creek bed',
        description: 'Multiple sacks of commercial debris left overnight near the bridge.',
        location_text: 'Bridge, Purok 2',
        photo_url: '/api/v1/uploads/evidence-photo-999.jpg',
      });
      expect(
        screen.getByText(/Your report was successfully submitted to Barangay Sabang officials!/i)
      ).toBeInTheDocument();
    });
  });
});
