import { API_BASE_URL } from './config';
import { HealthResponse } from '@/types/api';
import { LoginCredentials, SessionUserResponse } from '@/types/auth';
import {
  ReportCreatePayload,
  ReportStatusUpdatePayload,
  ReportListResponse,
  WasteReport,
} from '@/types/reports';
import {
  ScheduleItem,
  ScheduleListResponse,
  ScheduleCreatePayload,
  AdvisoryItem,
  AdvisoryListResponse,
  AdvisoryCreatePayload,
} from '@/types/schedules';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// In-memory cache for active CSRF token
let activeCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  activeCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return activeCsrfToken;
}

/**
 * Centralized fetch helper for FastAPI backend endpoints.
 * Automatically includes credentials (cookies) and CSRF header on mutating requests.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  // Attach X-CSRF-Token header to state-mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && activeCsrfToken) {
    headers['X-CSRF-Token'] = activeCsrfToken;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...((options.headers as Record<string, string>) || {}),
      },
      // Include cookies cross-origin / same-origin
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const errorMessage =
        errorData?.error?.message ||
        errorData?.detail ||
        `Request failed with status ${response.status}`;

      throw new ApiClientError(errorMessage, response.status, errorData);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    throw new ApiClientError(
      `Unable to reach API backend at ${API_BASE_URL}. (${message})`,
      0
    );
  }
}

/**
 * System health check.
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/v1/health');
}

/**
 * Authenticate with credentials and initialize session.
 */
export async function login(credentials: LoginCredentials): Promise<SessionUserResponse> {
  const data = await apiFetch<SessionUserResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (data?.csrf_token) {
    setCsrfToken(data.csrf_token);
  }
  return data;
}

/**
 * Terminate active session and clear cookies.
 */
export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>('/api/v1/auth/logout', {
    method: 'POST',
  });
  setCsrfToken(null);
}

/**
 * Inspect active session identity and permissions.
 */
export async function getMe(): Promise<SessionUserResponse> {
  const data = await apiFetch<SessionUserResponse>('/api/v1/auth/me');
  if (data?.csrf_token) {
    setCsrfToken(data.csrf_token);
  }
  return data;
}

/**
 * Submit a community waste report (Resident).
 */
export async function createReport(payload: ReportCreatePayload): Promise<WasteReport> {
  return apiFetch<WasteReport>('/api/v1/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch reports submitted by current resident.
 */
export async function getMyReports(): Promise<ReportListResponse> {
  return apiFetch<ReportListResponse>('/api/v1/reports/my');
}

/**
 * Fetch all reports for staff/admin review with optional filters.
 */
export async function getAllReports(params?: {
  category?: string;
  status?: string;
}): Promise<ReportListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.status) searchParams.set('status', params.status);
  const queryString = searchParams.toString();
  const endpoint = `/api/v1/reports${queryString ? `?${queryString}` : ''}`;
  return apiFetch<ReportListResponse>(endpoint);
}

/**
 * Fetch single report details with full status history.
 */
export async function getReportById(id: number): Promise<WasteReport> {
  return apiFetch<WasteReport>(`/api/v1/reports/${id}`);
}

/**
 * Update report status and append to immutable history (Staff / Admin).
 */
export async function updateReportStatus(
  id: number,
  payload: ReportStatusUpdatePayload
): Promise<WasteReport> {
  return apiFetch<WasteReport>(`/api/v1/reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}


export async function getSchedules(params?: {
  areaId?: number;
  dayOfWeek?: string;
}): Promise<ScheduleListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.areaId) searchParams.set('area_id', params.areaId.toString());
  if (params?.dayOfWeek) searchParams.set('day_of_week', params.dayOfWeek);
  const query = searchParams.toString();
  return apiFetch<ScheduleListResponse>(`/api/v1/schedules${query ? `?${query}` : ''}`);
}

export async function createSchedule(
  payload: ScheduleCreatePayload
): Promise<ScheduleItem> {
  return apiFetch<ScheduleItem>('/api/v1/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteSchedule(scheduleId: number): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>(`/api/v1/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
}

export async function getAdvisories(params?: {
  areaId?: number;
}): Promise<AdvisoryListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.areaId) searchParams.set('area_id', params.areaId.toString());
  const query = searchParams.toString();
  return apiFetch<AdvisoryListResponse>(`/api/v1/schedules/advisories${query ? `?${query}` : ''}`);
}

export async function createAdvisory(
  payload: AdvisoryCreatePayload
): Promise<AdvisoryItem> {
  return apiFetch<AdvisoryItem>('/api/v1/schedules/advisories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


export interface AreaItem {
  id: number;
  code: string;
  name: string;
  description?: string | null;
}

export async function getScheduleAreas(): Promise<AreaItem[]> {
  return apiFetch<AreaItem[]>('/api/v1/schedules/areas');
}


import {
  AnnouncementItem,
  AnnouncementListResponse,
  AnnouncementCreatePayload,
} from '@/types/announcements';

export async function getAnnouncements(category?: string): Promise<AnnouncementListResponse> {
  const searchParams = new URLSearchParams();
  if (category) searchParams.set('category', category);
  const query = searchParams.toString();
  return apiFetch<AnnouncementListResponse>(`/api/v1/announcements${query ? `?${query}` : ''}`);
}

export async function createAnnouncement(
  payload: AnnouncementCreatePayload
): Promise<AnnouncementItem> {
  return apiFetch<AnnouncementItem>('/api/v1/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteAnnouncement(
  announcementId: number
): Promise<{ message: string; id: number }> {
  return apiFetch<{ message: string; id: number }>(`/api/v1/announcements/${announcementId}`, {
    method: 'DELETE',
  });
}
