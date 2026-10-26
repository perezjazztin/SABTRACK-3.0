export type AnnouncementCategory =
  | 'GENERAL'
  | 'CLEANUP_DRIVE'
  | 'HOLIDAY_SCHEDULE'
  | 'EMERGENCY'
  | 'POLICY_UPDATE';

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

export interface AnnouncementListResponse {
  items: AnnouncementItem[];
  total: number;
}

export interface AnnouncementCreatePayload {
  title: string;
  content: string;
  category: AnnouncementCategory;
  is_pinned?: boolean;
}
