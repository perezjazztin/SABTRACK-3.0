import { UserRole } from './auth';

export interface AdminUserItem {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  area_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: AdminUserItem[];
  total: number;
}

export interface UserCreatePayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  area_id?: number | null;
}
