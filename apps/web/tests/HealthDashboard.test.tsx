import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { HealthDashboard } from '@/components/HealthDashboard';
import * as apiClient from '@/lib/api-client';

describe('HealthDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state and displays successful online status', async () => {
    vi.spyOn(apiClient, 'getHealth').mockResolvedValueOnce({
      status: 'ok',
      version: '3.0.0',
      environment: 'development',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });

    render(<HealthDashboard />);

    expect(screen.getByText(/System & Foundation Diagnostics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('REST API Online')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  it('handles offline backend gracefully and renders error banner', async () => {
    vi.spyOn(apiClient, 'getHealth').mockRejectedValueOnce(
      new Error('Unable to reach API backend at http://localhost:8000')
    );

    render(<HealthDashboard />);

    await waitFor(() => {
      expect(screen.getByText('API Connection Offline')).toBeInTheDocument();
      expect(screen.getByText('Unreachable')).toBeInTheDocument();
    });
  });
});
