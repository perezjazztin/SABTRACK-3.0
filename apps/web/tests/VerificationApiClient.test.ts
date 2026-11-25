import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanGovernmentId, verifyFaceBiometrics } from '@/lib/api-client';

describe('Verification API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('submits ID scan multipart request and returns extracted fields', async () => {
    const mockFile = new File(['mock_id_content'], 'id.png', { type: 'image/png' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        temp_verification_id: 'temp_12345',
        extracted_data: {
          full_name: 'JUAN DELA CRUZ',
          dob: '1995-08-15',
          age: 31,
          address: 'BARANGAY SABANG',
          id_number_masked: '****-****-3456',
          id_type: 'PHILIPPINE_NATIONAL_ID',
        },
        message: 'ID scanned successfully.',
      }),
    });

    const res = await scanGovernmentId(mockFile, 'PHILIPPINE_NATIONAL_ID');
    expect(res.temp_verification_id).toBe('temp_12345');
    expect(res.extracted_data.full_name).toBe('JUAN DELA CRUZ');
    expect(res.extracted_data.age).toBe(31);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/identity-verification/scan-id'),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('submits live face biometric snapshot and receives verification token', async () => {
    const mockBlob = new Blob(['mock_face_content'], { type: 'image/png' });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        verification_token: 'token_secret_998877',
        match_score: 0.88,
        status: 'VERIFIED',
        message: 'Face verified successfully.',
      }),
    });

    const res = await verifyFaceBiometrics('temp_12345', mockBlob);
    expect(res.verification_token).toBe('token_secret_998877');
    expect(res.match_score).toBe(0.88);
    expect(res.status).toBe('VERIFIED');
  });
});
