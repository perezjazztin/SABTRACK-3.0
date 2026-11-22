import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import RegisterPage from '@/app/register/page';
import * as apiClient from '@/lib/api-client';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe('RegisterPage Component with Integrated Identity Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders original registration UI layout with form fields and ID verification section', () => {
    render(<RegisterPage />);

    // Brand and Page Headings
    expect(screen.getByRole('heading', { name: /Register as a Resident/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /SABTRACK 3\.0/i })).toBeInTheDocument();

    // ID & Biometric Verification Section
    expect(screen.getByRole('heading', { name: /Government ID &.*Biometric Verification/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Government ID Type/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Philippine National ID/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('id-upload-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan & Process ID/i })).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Live Facial Biometric Verification/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Face Verification/i })).toBeInTheDocument();

    // Core Form Fields
    expect(screen.getByLabelText(/Full legal name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resident ID number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purok \/ Barangay Zone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();

    // Submit & Navigation Buttons
    const submitBtn = screen.getByRole('button', { name: /Create Resident Account/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled(); // Disabled until verified & filled
    expect(screen.getByRole('link', { name: /Sign in/i })).toBeInTheDocument();
  });

  it('allows entering resident details and auto-capitalizes Resident ID number', () => {
    render(<RegisterPage />);

    const residentIdInput = screen.getByLabelText(/Resident ID number/i) as HTMLInputElement;
    fireEvent.change(residentIdInput, {
      target: { value: 'sab-2026-0912' },
    });

    expect(residentIdInput.value).toBe('SAB-2026-0912');
  });

  it('completes verified registration after ID scan and face biometric match', async () => {
    vi.spyOn(apiClient, 'scanGovernmentId').mockResolvedValue({
      temp_verification_id: 'temp_sess_999',
      extracted_data: {
        full_name: 'JUAN DELA CRUZ',
        dob: '1995-08-15',
        age: 31,
        address: 'BARANGAY SABANG',
        id_number_masked: '****-****-0842',
        id_type: 'PHILIPPINE_NATIONAL_ID',
      },
      message: 'ID scanned successfully.',
    });

    vi.spyOn(apiClient, 'verifyFaceBiometrics').mockResolvedValue({
      verification_token: 'valid_token_0842',
      match_score: 0.95,
      status: 'VERIFIED',
      message: 'Face verified successfully.',
    });

    const mockRegister = vi.spyOn(apiClient, 'registerResident').mockResolvedValue({
      id: 99,
      email: 'juan.delacruz@sabtrack.local',
      full_name: 'JUAN DELA CRUZ',
      role: 'RESIDENT',
      area_id: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    render(<RegisterPage />);

    // Step 1: Upload and scan ID
    const fileInput = screen.getByTestId('id-upload-input');
    const dummyFile = new File(['mock_id_content'], 'id.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    fireEvent.click(screen.getByRole('button', { name: /Scan & Process ID/i }));

    // Auto-populates extracted name and masked ID from scanGovernmentId
    await waitFor(() => {
      expect(screen.getByDisplayValue('JUAN DELA CRUZ')).toBeInTheDocument();
      expect(screen.getByDisplayValue('****-****-0842')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Face Verification/i })).toBeInTheDocument();
    });

    // Step 2: Start face verification & capture
    fireEvent.click(screen.getByRole('button', { name: /Start Face Verification/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Capture Face Photo/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Capture Face Photo/i }));

    // Verified badge should appear
    await waitFor(() => {
      expect(screen.getByText(/Verified \(95%\)/i)).toBeInTheDocument();
    });

    // Step 3: Complete remaining fields
    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: 'juan.delacruz@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Purok \/ Barangay Zone/i), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'ValidResidentPass2026!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), {
      target: { value: 'ValidResidentPass2026!' },
    });

    // Accept privacy
    const privacyCheckbox = screen.getByRole('checkbox');
    fireEvent.click(privacyCheckbox);

    // Step 4: Submit form
    const submitBtn = screen.getByRole('button', { name: /Create Resident Account/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'juan.delacruz@sabtrack.local',
        full_name: 'JUAN DELA CRUZ',
        password: 'ValidResidentPass2026!',
        area_id: 1,
        resident_id_num: '****-****-0842',
        verification_token: 'valid_token_0842',
      });
    });

    expect(localStorage.getItem('sabtrack_registered_resident_id')).toBe('****-****-0842');
    expect(screen.getByText(/Resident identity verified and account registered successfully/i)).toBeInTheDocument();
  });
});
