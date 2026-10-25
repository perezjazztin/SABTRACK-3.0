export type UserRole =
  | 'RESIDENT'
  | 'BARANGAY_STAFF'
  | 'BARANGAY_ADMIN'
  | 'SYSTEM_MAINTAINER';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  area_id?: number | null;
  resident_id_num?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SessionUserResponse {
  user: User;
  permissions: string[];
  csrf_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  area_id?: number | null;
  resident_id_num?: string | null;
}
