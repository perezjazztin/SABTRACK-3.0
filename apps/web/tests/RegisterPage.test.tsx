import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import RegisterPage from '@/app/register/page';
import * as apiClient from '@/lib/api-client';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('RegisterPage Component with Integrated Identity Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders Step 1 with supported government ID options', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: /Resident Account Registration/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Government ID Type/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Philippine National ID/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Scan & Process ID/i })).toBeInTheDocument();

    // Personal details form should be locked in Step 1
    expect(screen.queryByLabelText(/Create Password/i)).not.toBeInTheDocument();
  });

  it('completes verified registration after ID and face match', async () => {
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

    // Step 1 & 2: Upload and scan ID
    const fileInput = screen.getByTestId('id-upload-input');
    const dummyFile = new File(['mock_id_content'], 'id.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    fireEvent.click(screen.getByRole('button', { name: /Scan & Process ID/i }));

    // Step 3 & 4: Start face verification & capture
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Face Verification/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Start Face Verification/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Capture Face Photo/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Capture Face Photo/i }));

    // Step 5: Fill in required credentials on unlocked review form
    await waitFor(() => {
      expect(screen.getByLabelText(/Create Password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'juan.delacruz@sabtrack.local' },
    });
    fireEvent.change(screen.getByLabelText(/Barangay Sabang Purok \/ Zone/i), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText(/Create Password/i), {
      target: { value: 'ValidResidentPass2026!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'ValidResidentPass2026!' },
    });

    // Accept privacy
    const privacyCheckbox = screen.getByRole('checkbox');
    fireEvent.click(privacyCheckbox);

    // Complete registration
    fireEvent.click(screen.getByRole('button', { name: /Complete Verified Registration/i }));

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
  });
});
