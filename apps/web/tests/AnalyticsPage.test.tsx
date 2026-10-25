import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import AdminAnalyticsPage from '@/app/admin/analytics/page';
import * as authContext from '@/lib/auth-context';
import * as apiClient from '@/lib/api-client';
import { AnalyticsOverviewResponse } from '@/types/analytics';

const mockAnalyticsData: AnalyticsOverviewResponse = {
  total_reports: 24,
  open_reports: 6,
  resolved_reports: 18,
  resolution_rate_pct: 75.0,
  category_distribution: [
    { category: 'UNCOLLECTED_GARBAGE', count: 15, percentage: 62.5 },
    { category: 'ILLEGAL_DUMPING', count: 9, percentage: 37.5 },
  ],
  status_distribution: [
    { status: 'SUBMITTED', count: 3 },
    { status: 'IN_PROGRESS', count: 3 },
    { status: 'RESOLVED', count: 18 },
  ],
  area_hotspots: [
    {
      area_id: 1,
      area_name: 'Purok 1 Centro',
      report_count: 14,
      percentage: 58.3,
      severity_level: 'CRITICAL',
    },
    {
      area_id: 2,
      area_name: 'Purok 2 Riverside',
      report_count: 10,
      percentage: 41.7,
      severity_level: 'ELEVATED',
    },
  ],
  resolution_performance: {
    total_resolved: 18,
    avg_resolution_days: 1.45,
    median_resolution_days: 1.2,
  },
  community_engagement: {
    total_claims_awarded: 12,
    total_points_distributed: 600,
    active_initiatives_count: 3,
  },
  decision_insights: [
    {
      title: 'Critical Waste Hotspot: Purok 1 Centro',
      level: 'CRITICAL',
      observation: 'Purok 1 Centro accounts for 58.3% of all community complaints.',
      recommendation: 'Deploy an immediate supplementary waste collection truck.',
    },
  ],
  procedure_step: 'Step 6: Visual Indicators & Decision Support',
  generated_at: new Date().toISOString(),
  descriptive: {
    total_reports: 24,
    open_reports: 6,
    resolved_reports: 18,
    resolution_rate_pct: 75.0,
    avg_resolution_days: 1.45,
    median_resolution_days: 1.2,
    total_claims_awarded: 12,
    total_points_distributed: 600,
    active_initiatives_count: 3,
    category_distribution: [
      { category: 'UNCOLLECTED_GARBAGE', count: 15, percentage: 62.5 },
    ],
    status_distribution: [
      { status: 'RESOLVED', count: 18 },
    ],
    area_hotspots: [
      {
        area_id: 1,
        area_name: 'Purok 1 Centro',
        report_count: 14,
        percentage: 58.3,
        severity_level: 'CRITICAL',
      },
    ],
    daily_operational_trend: [
      { date: '2026-10-25', submitted_count: 4, resolved_count: 3 },
    ],
  },
  predictive: {
    forecast_horizon_days: 7,
    trend_direction: 'UPWARD',
    projected_weekly_reports: 28.5,
    projected_change_pct: 18.7,
    backlog_clearance_eta_days: 2.1,
    projected_truck_runs_needed: 6,
    area_risk_forecasts: [
      {
        area_id: 1,
        area_name: 'Purok 1 Centro',
        historical_count: 14,
        predicted_weekly_incidents: 16.2,
        overflow_probability_pct: 78.5,
        risk_level: 'HIGH_RISK',
        predicted_dominant_category: 'UNCOLLECTED_GARBAGE',
        proactive_dispatch_action: 'Pre-deploy secondary waste collection vehicle and schedule daily eco-patrol inspection.',
      },
    ],
    model_methodology: 'Linear Trend Regression with 7-Day Moving Window & Bayesian Prior',
  },
};

describe('AdminAnalyticsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 3,
        email: 'admin.demo@sabtrack.local',
        role: 'BARANGAY_ADMIN',
        full_name: 'Barangay Captain Admin',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      permissions: ['analytics:read', 'reports:review'],
      loading: false,
      error: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn().mockReturnValue(true),
      hasRole: (roles: any) => {
        const list = Array.isArray(roles) ? roles : [roles];
        return list.includes('BARANGAY_ADMIN');
      },
      refreshSession: vi.fn(),
    });
  });

  it('renders executive analytics and 6-stage pipeline banner', async () => {
    vi.spyOn(apiClient, 'getAnalyticsOverview').mockResolvedValue(mockAnalyticsData);

    render(<AdminAnalyticsPage />);

    expect(screen.getByText(/Executive Business Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Formal 6-Stage Business Analytics Procedure/i)).toBeInTheDocument();
    expect(screen.getByText(/RA 10173 Sanitized/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('600')).toBeInTheDocument();
    });
  });

  it('displays geographic hotspot matrix and decision support insight', async () => {
    vi.spyOn(apiClient, 'getAnalyticsOverview').mockResolvedValue(mockAnalyticsData);

    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Purok 1 Centro').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Critical Hotspot')).toBeInTheDocument();
      expect(screen.getByText(/Critical Waste Hotspot: Purok 1 Centro/i)).toBeInTheDocument();
      expect(screen.getByText(/Deploy an immediate supplementary waste collection truck/i)).toBeInTheDocument();
    });
  });

  it('renders predictive forecasting results and risk matrix', async () => {
    vi.spyOn(apiClient, 'getAnalyticsOverview').mockResolvedValue(mockAnalyticsData);

    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Predictive Analytics & Operational Forecasts/i)).toBeInTheDocument();
      expect(screen.getByText('28.5')).toBeInTheDocument(); // Projected weekly
      expect(screen.getAllByText('6').length).toBeGreaterThanOrEqual(2); // Open reports and truck runs
      expect(screen.getByText('2.1d')).toBeInTheDocument(); // Clearance ETA
      expect(screen.getByText(/High Overflow Risk/i)).toBeInTheDocument();
      expect(screen.getByText('78.5%')).toBeInTheDocument();
      expect(screen.getByText(/Pre-deploy secondary waste collection vehicle/i)).toBeInTheDocument();
    });
  });

  it('renders View-Only access mode banner for BARANGAY_STAFF', async () => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 2,
        email: 'staff.demo@sabtrack.local',
        role: 'BARANGAY_STAFF',
        full_name: 'Kagawad Staff',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      permissions: ['analytics:read', 'reports:review'],
      loading: false,
      error: null,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn().mockReturnValue(true),
      hasRole: (roles: any) => {
        const list = Array.isArray(roles) ? roles : [roles];
        return list.includes('BARANGAY_STAFF');
      },
      refreshSession: vi.fn(),
    });

    vi.spyOn(apiClient, 'getAnalyticsOverview').mockResolvedValue(mockAnalyticsData);

    render(<AdminAnalyticsPage />);

    expect(screen.getByText('Staff View-Only Access Mode')).toBeInTheDocument();
    expect(screen.getByText('Read-Only')).toBeInTheDocument();
  });
});
