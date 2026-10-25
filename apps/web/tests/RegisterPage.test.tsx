import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import RegisterPage from '@/app/register/page';
import * as apiClient from '@/lib/api-client';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('RegisterPage Component with Resident ID Number', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders all registration form fields including Resident ID Number', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: /Register as a Resident/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Legal Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resident ID Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purok \/ Barangay Zone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Auto-Generate ID/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Resident Account/i })).toBeInTheDocument();
  });

  it('auto-generates a valid SAB-2026-XXXX Resident ID when Auto-Generate button is clicked', () => {
    render(<RegisterPage />);

    const residentIdInput = screen.getByLabelText(/Resident ID Number/i) as HTMLInputElement;
    expect(residentIdInput.value).toBe('');

    const autoGenBtn = screen.getByRole('button', { name: /Auto-Generate ID/i });
    fireEvent.click(autoGenBtn);

    expect(residentIdInput.value).toMatch(/^SAB-2026-\d{4}$/);
  });

  it('successfully submits registration with custom Resident ID number and stores in localStorage', async () => {
    const mockRegister = vi.spyOn(apiClient, 'registerResident').mockResolvedValue({
      id: 99,
      email: 'juan.delacruz@sabtrack.local',
      full_name: 'Juan Dela Cruz',
      role: 'RESIDENT',
      area_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/Full Legal Name/i), {
      target: { value: 'Juan Dela Cruz' },
    });
    fireEvent.change(screen.getByLabelText(/Resident ID Number/i), {
      target: { value: 'SAB-2026-0842' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'juan.delacruz@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Purok \/ Barangay Zone/i), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'ValidResidentPass2026!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'ValidResidentPass2026!' },
    });

    // Check privacy checkbox
    const privacyCheckbox = screen.getByRole('checkbox');
    fireEvent.click(privacyCheckbox);

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Create Resident Account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'juan.delacruz@sabtrack.local',
        full_name: 'Juan Dela Cruz',
        password: 'ValidResidentPass2026!',
        area_id: 1,
        resident_id_num: 'SAB-2026-0842',
      });
    });

    expect(localStorage.getItem('sabtrack_registered_resident_id')).toBe('SAB-2026-0842');
    expect(screen.getByText(/Resident account registered successfully/i)).toBeInTheDocument();
  });
});
