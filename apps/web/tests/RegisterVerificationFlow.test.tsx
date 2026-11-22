import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import RegisterPage from '@/app/register/page';
import * as apiClient from '@/lib/api-client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('RegisterPage Integrated Identity Verification Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    // Mock mediaDevices for direct ID camera scanning
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  it('displays supported government IDs in verification section and requires verification before submission', () => {
    render(<RegisterPage />);

    // Supported government IDs
    expect(screen.getAllByText(/Philippine National ID/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Driver's License/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Passport/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UMID/i).length).toBeGreaterThan(0);

    // Options for both file upload and direct camera scanning
    expect(screen.getByText(/Choose ID File/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Scan with Camera/i })).toBeInTheDocument();

    // Submit button disabled before verification
    const submitBtn = screen.getByRole('button', { name: /Create Resident Account/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Please complete the Government ID and Face Biometrics verification/i)).toBeInTheDocument();
  });

  it('allows user to delete a chosen ID image', async () => {
    render(<RegisterPage />);

    // Choose an ID file
    const fileInput = screen.getByTestId('id-upload-input');
    const dummyFile = new File(['mock_id_data'], 'philsys_sample.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    // Preview and Delete button appear
    expect(await screen.findByText('philsys_sample.png')).toBeInTheDocument();
    const deleteBtn = screen.getByRole('button', { name: /Delete ID image/i });
    expect(deleteBtn).toBeInTheDocument();

    // Click Delete button
    fireEvent.click(deleteBtn);

    // Preview should be removed and Choose ID File / Camera options remain ready
    await waitFor(() => {
      expect(screen.queryByText('philsys_sample.png')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete ID image/i })).not.toBeInTheDocument();
    });
  });

  it('allows direct scanning of ID via camera and pasts extracted details into form below', async () => {
    vi.spyOn(apiClient, 'scanGovernmentId').mockResolvedValue({
      temp_verification_id: 'camera_sess_456',
      extracted_data: {
        full_name: 'MARIA CLARA DE LOS SANTOS',
        dob: '1998-05-20',
        age: 28,
        address: 'PUROK 3, BARANGAY SABANG',
        id_number_masked: '****-****-9876',
        id_type: 'PHILIPPINE_NATIONAL_ID',
      },
      message: 'ID scanned successfully.',
    });

    render(<RegisterPage />);

    // Click "Scan with Camera" to open direct ID camera modal
    fireEvent.click(screen.getByRole('button', { name: /Scan with Camera/i }));

    // Modal opens
    expect(await screen.findByRole('heading', { name: /Scan Government ID with Camera/i })).toBeInTheDocument();

    // Click "Capture ID Photo" in modal
    fireEvent.click(screen.getByRole('button', { name: /Capture ID Photo/i }));

    // Modal closes and captured file appears with delete button
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Scan Government ID with Camera/i })).not.toBeInTheDocument();
      expect(screen.getByText('id_camera_scan.jpg')).toBeInTheDocument();
    });

    // Click "Scan & Process ID"
    fireEvent.click(screen.getByRole('button', { name: /Scan & Process ID/i }));

    // Verified details MUST be pasted correctly into the form below
    await waitFor(() => {
      const fullNameInput = screen.getByLabelText(/Full legal name/i) as HTMLInputElement;
      const residentIdInput = screen.getByLabelText(/Resident ID number/i) as HTMLInputElement;
      expect(fullNameInput.value).toBe('MARIA CLARA DE LOS SANTOS');
      expect(residentIdInput.value).toBe('****-****-9876');
      expect(screen.getByText(/ID details extracted successfully! Legal name and ID number have been populated in the form below/i)).toBeInTheDocument();
    });
  });

  it('handles ID scan failure gracefully', async () => {
    vi.spyOn(apiClient, 'scanGovernmentId').mockRejectedValue(
      new Error('ID image is too blurry. Please upload a clear photo.')
    );

    render(<RegisterPage />);

    const fileInput = screen.getByTestId('id-upload-input');
    const dummyFile = new File(['blurry_id'], 'id.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    fireEvent.click(screen.getByRole('button', { name: /Scan & Process ID/i }));

    await waitFor(() => {
      expect(screen.getByText(/ID image is too blurry/i)).toBeInTheDocument();
    });
  });

  it('allows user to re-verify after completing verification', async () => {
    vi.spyOn(apiClient, 'scanGovernmentId').mockResolvedValue({
      temp_verification_id: 'temp_sess_123',
      extracted_data: {
        full_name: 'JUAN DELA CRUZ',
        dob: '1995-08-15',
        age: 31,
        address: 'PUROK 2, SABANG',
        id_number_masked: '****-****-3456',
        id_type: 'PHILIPPINE_NATIONAL_ID',
      },
      message: 'ID scanned successfully.',
    });

    vi.spyOn(apiClient, 'verifyFaceBiometrics').mockResolvedValue({
      verification_token: 'valid_token_abc',
      match_score: 0.91,
      status: 'VERIFIED',
      message: 'Face verified successfully.',
    });

    render(<RegisterPage />);

    // Upload & Scan
    const fileInput = screen.getByTestId('id-upload-input');
    const dummyFile = new File(['mock_id'], 'id.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });
    fireEvent.click(screen.getByRole('button', { name: /Scan & Process ID/i }));

    // Face capture
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Face Verification/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Start Face Verification/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Capture Face Photo/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Capture Face Photo/i }));

    // Verified state
    await waitFor(() => {
      expect(screen.getByText(/Verified \(91%\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Re-verify/i })).toBeInTheDocument();
    });

    // Click Re-verify to reset
    fireEvent.click(screen.getByRole('button', { name: /Re-verify/i }));

    // Verification controls reappear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Scan & Process ID/i })).toBeInTheDocument();
      expect(screen.queryByText(/Verified \(91%\)/i)).not.toBeInTheDocument();
    });
  });
});
