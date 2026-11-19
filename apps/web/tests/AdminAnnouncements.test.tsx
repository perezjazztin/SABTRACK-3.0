import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AdminAnnouncementsPage from '@/app/admin/announcements/page';
import * as authContext from '@/lib/auth-context';
import * as apiClient from '@/lib/api-client';
import { AnnouncementItem } from '@/types/announcements';

const mockAnnouncements: AnnouncementItem[] = [
  {
    id: 1,
    title: 'Clean-Up Drive this Saturday',
    content: 'All residents are invited to join our community river clean-up.',
    category: 'CLEANUP_DRIVE',
    is_pinned: true,
    is_active: true,
    is_demo_data: true,
    author_id: 2,
    author_name: 'Test Staff Reviewer',
    created_at: '2026-10-25T08:00:00Z',
    updated_at: '2026-10-25T08:00:00Z',
  },
];

describe('AdminAnnouncementsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 2,
        email: 'staff.demo@sabtrack.local',
        full_name: 'Barangay Staff Demo',
        role: 'BARANGAY_STAFF',
        is_active: true,
        created_at: '2026-10-25T08:00:00Z',
      },
      isAuthenticated: true,
      loading: false,
      permissions: ['announcements:manage'],
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn().mockReturnValue(true),
      hasPermission: vi.fn().mockReturnValue(true),
      refreshSession: vi.fn(),
    });

    vi.spyOn(apiClient, 'getAnnouncements').mockResolvedValue({
      items: mockAnnouncements,
      total: 1,
    });
  });

  it('renders published announcements table and compose button for authorized staff', async () => {
    render(<AdminAnnouncementsPage />);

    expect(screen.getByText(/Announcements & Bulletins Publisher/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compose Notice/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Clean-Up Drive this Saturday')).toBeInTheDocument();
      expect(screen.getByText('Test Staff Reviewer')).toBeInTheDocument();
      expect(screen.getByText('CLEANUP_DRIVE')).toBeInTheDocument();
    });
  });

  it('opens compose modal and submits new announcement with CSRF protection', async () => {
    const createSpy = vi.spyOn(apiClient, 'createAnnouncement').mockResolvedValue({
      id: 2,
      title: 'Holiday Waste Collection Shift',
      content: 'Garbage pickup will be moved to Monday due to the public holiday.',
      category: 'HOLIDAY_SCHEDULE',
      is_pinned: false,
      is_active: true,
      is_demo_data: true,
      author_id: 2,
      author_name: 'Barangay Staff Demo',
      created_at: '2026-10-26T08:00:00Z',
      updated_at: '2026-10-26T08:00:00Z',
    });

    render(<AdminAnnouncementsPage />);

    const composeBtn = screen.getByRole('button', { name: /Compose Notice/i });
    fireEvent.click(composeBtn);

    expect(screen.getByText('Compose Official Barangay Notice')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Barangay Sabang Clean-Up Drive/i), {
      target: { value: 'Holiday Waste Collection Shift' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Provide full details, meeting location/i), {
      target: { value: 'Garbage pickup will be moved to Monday due to the public holiday.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Publish Notice/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        title: 'Holiday Waste Collection Shift',
        content: 'Garbage pickup will be moved to Monday due to the public holiday.',
        category: 'GENERAL',
        is_pinned: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Official notice published successfully/i)).toBeInTheDocument();
    });
  });

  it('prevents submission and displays inline error when headline is too short', async () => {
    const createSpy = vi.spyOn(apiClient, 'createAnnouncement');
    render(<AdminAnnouncementsPage />);

    const composeBtn = screen.getByRole('button', { name: /Compose Notice/i });
    fireEvent.click(composeBtn);

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Barangay Sabang Clean-Up Drive/i), {
      target: { value: 'Tiny' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Provide full details, meeting location/i), {
      target: { value: 'Valid description text here.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Publish Notice/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Announcement headline must be at least 5 characters long/i)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('calls deleteAnnouncement when staff confirms deactivation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.spyOn(apiClient, 'deleteAnnouncement').mockResolvedValue({
      message: 'Announcement deactivated successfully',
      id: 1,
    });

    render(<AdminAnnouncementsPage />);

    await waitFor(() => {
      expect(screen.getByText('Clean-Up Drive this Saturday')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle(/Deactivate/i);
    fireEvent.click(deleteBtn);

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });
});

describe('CSRF Token Defense & Auto-Recovery in api-client', () => {
  beforeEach(() => {
    apiClient.setCsrfToken(null);
    if (typeof document !== 'undefined') {
      document.cookie = 'sabtrack_csrf=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  it('reads CSRF token from document.cookie fallback when in-memory token is absent', () => {
    document.cookie = 'sabtrack_csrf=cookie-secret-csrf-token-123; path=/;';
    expect(apiClient.getCsrfToken()).toBe('cookie-secret-csrf-token-123');
  });

  it('reads CSRF token from sessionStorage fallback when document.cookie is absent', () => {
    window.sessionStorage.setItem('sabtrack_csrf_token', 'session-storage-csrf-token-456');
    expect(apiClient.getCsrfToken()).toBe('session-storage-csrf-token-456');
  });

  it('persists token to sessionStorage when setCsrfToken is called', () => {
    apiClient.setCsrfToken('fresh-csrf-token-789');
    expect(apiClient.getCsrfToken()).toBe('fresh-csrf-token-789');
    expect(window.sessionStorage.getItem('sabtrack_csrf_token')).toBe('fresh-csrf-token-789');
  });

  it('clears sessionStorage when setCsrfToken(null) is called on logout', () => {
    apiClient.setCsrfToken('fresh-csrf-token-789');
    apiClient.setCsrfToken(null);
    expect(apiClient.getCsrfToken()).toBeNull();
    expect(window.sessionStorage.getItem('sabtrack_csrf_token')).toBeNull();
  });
});
