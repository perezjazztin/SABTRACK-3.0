export type ReportCategory =
  | 'UNCOLLECTED_GARBAGE'
  | 'ILLEGAL_DUMPING'
  | 'IMPROPER_SEGREGATION'
  | 'HAZARDOUS_WASTE'
  | 'OVERFLOWING_BIN'
  | 'OTHER';

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export interface StatusHistoryItem {
  id: number;
  previous_status: string | null;
  new_status: string;
  changed_by_name: string;
  changed_by_role: string;
  remarks: string | null;
  created_at: string;
}

export interface WasteReport {
  id: number;
  resident_id: number;
  resident_name: string;
  category: ReportCategory;
  title: string;
  description: string;
  location_text: string;
  area_id: number | null;
  area_name: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  is_demo_data: boolean;
  created_at: string;
  updated_at: string;
  status_history: StatusHistoryItem[];
}

export interface ReportCreatePayload {
  category: ReportCategory;
  title: string;
  description: string;
  location_text: string;
  area_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  photo_url: string;
}

export interface ReportStatusUpdatePayload {
  status: ReportStatus;
  remarks?: string | null;
  admin_notes?: string | null;
}

export interface ReportListResponse {
  items: WasteReport[];
  total: number;
}
