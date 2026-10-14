export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  environment: string;
  timestamp: string;
  database: 'connected' | 'disconnected';
}

export interface Area {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  is_demo_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
