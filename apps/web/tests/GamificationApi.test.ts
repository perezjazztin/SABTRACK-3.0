import { afterEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '@/lib/api-client';
import { RedemptionRequest, RedemptionReviewPayload } from '@/types/gamification';

const reviewPayload: RedemptionReviewPayload = {
  status: 'CANCELLED',
  review_notes: 'Cancelled for this academic demo.',
};

const reviewedRedemption: RedemptionRequest = {
  id: 42,
  resident_id: 10,
  resident_name: 'Resident Demo',
  reward_id: 3,
  reward_name: 'Demo Eco Kit',
  points_spent: 80,
  claim_code: 'XY90ZT12',
  status: 'CANCELLED',
  review_notes: 'Cancelled for this academic demo.',
  fulfilled_at: null,
  created_at: '2026-11-01T00:00:00Z',
};

describe('redemption review API integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a typed review transition to the protected redemption endpoint', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => reviewedRedemption,
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await apiClient.reviewRedemption(42, reviewPayload);

    expect(result).toEqual(reviewedRedemption);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/gamification/redemptions/42/review'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(reviewPayload),
      })
    );
  });
});
