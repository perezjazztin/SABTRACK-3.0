export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type WasteType =
  | 'BIODEGRADABLE'
  | 'NON_BIODEGRADABLE'
  | 'RECYCLABLE'
  | 'SPECIAL_HAZARDOUS';

export type AdvisoryType =
  | 'DELAY'
  | 'ROUTE_CHANGE'
  | 'SPECIAL_COLLECTION'
  | 'HOLIDAY_SUSPENSION';

export interface ScheduleItem {
  id: number;
  area_id: number;
  area_name?: string | null;
  area_code?: string | null;
  day_of_week: DayOfWeek;
  waste_type: WasteType;
  start_time: string;
  end_time: string;
  notes?: string | null;
  is_active: boolean;
  is_demo_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdvisoryItem {
  id: number;
  area_id?: number | null;
  area_name?: string | null;
  title: string;
  message: string;
  advisory_type: AdvisoryType;
  effective_date: string;
  created_by_name: string;
  is_active: boolean;
  created_at: string;
}

export interface ScheduleListResponse {
  items: ScheduleItem[];
  total: number;
}

export interface AdvisoryListResponse {
  items: AdvisoryItem[];
  total: number;
}

export interface ScheduleCreatePayload {
  area_id: number;
  day_of_week: DayOfWeek;
  waste_type: WasteType;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface AdvisoryCreatePayload {
  area_id?: number | null;
  title: string;
  message: string;
  advisory_type: AdvisoryType;
  effective_date: string;
}

export interface ScheduleNotificationPayload {
  email?: string;
}

export interface ScheduleNotificationResponse {
  message: string;
  schedule_id: number;
  recipient_email: string;
  day_of_week: string;
  waste_type: string;
  collection_time: string;
  area_name?: string | null;
}
