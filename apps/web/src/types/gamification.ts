export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type TransactionType =
  | 'CLAIM_AWARD'
  | 'CIVIC_BONUS'
  | 'REWARD_REDEMPTION';

export interface InitiativeItem {
  id: number;
  title: string;
  description: string;
  points_reward: number;
  event_date: string;
  location: string;
  is_active: boolean;
  is_demo_data: boolean;
  created_at: string;
}

export interface ClaimItem {
  id: number;
  resident_id: number;
  resident_name: string;
  initiative_id?: number | null;
  initiative_title?: string | null;
  activity_title: string;
  description: string;
  evidence_url?: string | null;
  points_requested: number;
  status: ClaimStatus;
  reviewed_by_name?: string | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface PointsLedgerItem {
  id: number;
  points: number;
  transaction_type: TransactionType;
  description: string;
  created_at: string;
}

export interface ResidentPointsSummary {
  total_points: number;
  tier: string;
  verified_activities_count: number;
  ledger_history: PointsLedgerItem[];
  recent_claims: ClaimItem[];
}

export interface InitiativeCreatePayload {
  title: string;
  description: string;
  points_reward: number;
  event_date: string;
  location: string;
}

export interface ClaimCreatePayload {
  initiative_id?: number | null;
  activity_title: string;
  description: string;
  evidence_url?: string;
  points_requested?: number;
}

export interface ClaimReviewPayload {
  status: ClaimStatus;
  review_notes?: string;
  points_awarded?: number;
}
