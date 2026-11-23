// Enumerates bulletin categories for public barangay announcements and advisories.
export type AnnouncementCategory =
  | 'GENERAL'
  | 'CLEANUP_DRIVE'
  | 'HOLIDAY_SCHEDULE'
  | 'EMERGENCY'
  | 'POLICY_UPDATE';

// Represents an announcement item with author attribution, pin priority, and status flags.
export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  is_active: boolean;
  is_demo_data: boolean;
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}

// Response payload containing a paginated list of announcements.
export interface AnnouncementListResponse {
  items: AnnouncementItem[];
  total: number;
}

// Request payload for publishing a new bulletin or emergency advisory.
export interface AnnouncementCreatePayload {
  title: string;
  content: string;
  category: AnnouncementCategory;
  is_pinned?: boolean;
}
