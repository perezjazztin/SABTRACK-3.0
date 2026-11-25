// System health and connectivity diagnostics returned by the backend healthcheck endpoint.
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  environment: string;
  timestamp: string;
  database: 'connected' | 'disconnected';
}

// Geographic zone, barangay sector, or collection purok within the municipality.
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

// Standardized error response envelope returned by FastAPI exception handlers.
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
