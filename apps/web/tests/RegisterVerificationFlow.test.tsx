import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from '@/app/register/page';
import * as apiClient from '@/lib/api-client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('RegisterPage Multi-Step Gated Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays supported government IDs and keeps personal info form locked initially', () => {
    render(<RegisterPage />);
    
    // Supported government IDs from IT-312 guidelines
    expect(screen.getAllByText(/Philippine National ID/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Driver's License/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Passport/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/UMID/i).length).toBeGreaterThan(0);

    // Password field should not be present in Step 1
    expect(screen.queryByLabelText(/Create Password/i)).not.toBeInTheDocument();
  });

  it('completes ID upload, scanning, and unlocks Step 5 personal information', async () => {
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

    // Select ID type
    const selectElem = screen.getByLabelText(/Select Government ID Type/i);
    fireEvent.change(selectElem, { target: { value: 'PHILIPPINE_NATIONAL_ID' } });

    // Upload ID file
    const fileInput = screen.getByTestId('id-upload-input');
    const dummyFile = new File(['mock_id'], 'id.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    // Click "Scan & Verify ID"
    const scanBtn = screen.getByRole('button', { name: /Scan & Process ID/i });
    fireEvent.click(scanBtn);

    // After scan succeeds, prompt to start face capture
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Start Face Verification/i })).toBeInTheDocument();
    });

    // Start face verification (which triggers FaceCaptureModal)
    fireEvent.click(screen.getByRole('button', { name: /Start Face Verification/i }));

    // In modal, click capture
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Capture Face Photo/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Capture Face Photo/i }));

    // Step 5: Personal Information Review should now be visible and pre-populated
    await waitFor(() => {
      expect(screen.getByDisplayValue('JUAN DELA CRUZ')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1995-08-15')).toBeInTheDocument();
      expect(screen.getByDisplayValue('31')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PUROK 2, SABANG')).toBeInTheDocument();
    });
  });
});
