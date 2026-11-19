export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RedemptionStatus = 'PENDING' | 'APPROVED' | 'FULFILLED' | 'CANCELLED';
export type ClaimActivityType = 'SEGREGATION' | 'COMMUNITY_CLEANUP' | 'OTHER';
export type CivicTaskStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'UNAVAILABLE';
export type CivicTaskActionType = 'SUBMIT_REPORT' | 'CLAIM_SEGREGATION' | 'AUTO_AWARD' | 'MILESTONE';

export type TransactionType =
  | 'CLAIM_AWARD'
  | 'CIVIC_BONUS'
  | 'REWARD_REDEMPTION'
  | 'REWARD_REFUND'
  | 'ARTICLE_READ_AWARD';

export interface ArticleReadingStatus {
  completed_article_ids: string[];
  awards_today: number;
  daily_limit: number;
  points_per_article: number;
  minimum_read_seconds: number;
}

export interface ArticleReadingSession {
  article_id: string;
  session_id: string | null;
  opened_at: string | null;
  already_read: boolean;
}

export interface ArticleReadingCompletion {
  article_id: string;
  status: 'AWARDED' | 'ALREADY_READ' | 'DAILY_LIMIT_REACHED';
  points_awarded: number;
  awards_today: number;
}

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
  activity_type: ClaimActivityType;
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
  activity_type?: ClaimActivityType;
  points_requested?: number;
}

export interface ClaimReviewPayload {
  status: ClaimStatus;
  review_notes?: string;
  points_awarded?: number;
}

export interface RedemptionReviewPayload {
  status: RedemptionStatus;
  review_notes?: string;
}

// ---------------------------------------------------------------------------
// New: Rewards Catalog, Redemptions, Leaderboard, Civic Tasks
// ---------------------------------------------------------------------------

export interface RewardItem {
  id: number;
  name: string;
  description: string;
  points_required: number;
  category: string;
  stock_quantity: number;
  image_url?: string | null;
  is_active: boolean;
  is_demo_data: boolean;
  created_at: string;
}

export interface RedemptionRequest {
  id: number;
  resident_id: number;
  resident_name: string;
  reward_id: number;
  reward_name: string;
  points_spent: number;
  claim_code: string;
  status: RedemptionStatus;
  review_notes?: string | null;
  fulfilled_at?: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  resident_id: number;
  display_name: string;
  purok_name: string;
  total_points: number;
  tier: string;
  verified_activities_count: number;
  is_current_user: boolean;
}

export interface CivicTaskItem {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  category: string;
  status: CivicTaskStatus;
  progress_current: number;
  progress_target: number;
  is_repeatable: boolean;
  action_type: CivicTaskActionType;
  image_url?: string | null;
}
