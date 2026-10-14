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
