import { UserRole } from './auth';

// User record representation displayed in administrative user management tables.
export interface AdminUserItem {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  area_id: number | null;
  is_active: boolean;
  created_at: string;
}

// Paginated API response for administrative user directories.
export interface UserListResponse {
  items: AdminUserItem[];
  total: number;
}

// Payload schema for creating a new user or staff account.
export interface UserCreatePayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  area_id?: number | null;
}
