import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { RealTimeClock } from '@/components/RealTimeClock';

describe('RealTimeClock Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set fixed system time: Sunday, October 25, 2026 19:56:59 GMT+8
    const mockDate = new Date('2026-10-25T19:56:59+08:00');
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders live Philippine Standard Time (PST) and date after hydration', () => {
    render(<RealTimeClock />);

    const clock = screen.getByTestId('realtime-clock');
    expect(clock).toBeInTheDocument();
    expect(clock).toHaveAttribute('aria-label', 'Philippine Standard Time');

    // Check presence of time and date
    expect(screen.getByText(/2026/i)).toBeInTheDocument();
    expect(screen.getByText(/PST/i)).toBeInTheDocument();
  });

  it('advances time dynamically on every 1-second interval tick', () => {
    render(<RealTimeClock />);

    // Initial render time check
    expect(screen.getByText(/07:56:59\s*PM/i)).toBeInTheDocument();

    // Fast-forward by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Time should now be 07:57:00 PM
    expect(screen.getByText(/07:57:00\s*PM/i)).toBeInTheDocument();

    // Fast-forward by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Time should now be 07:57:05 PM
    expect(screen.getByText(/07:57:05\s*PM/i)).toBeInTheDocument();
  });

  it('supports banner variant with custom styling and hides PST label if configured', () => {
    render(<RealTimeClock variant="banner" showPSTLabel={false} />);

    const clock = screen.getByTestId('realtime-clock');
    expect(clock).toBeInTheDocument();
    expect(screen.queryByText(/^PST$/i)).not.toBeInTheDocument();
  });
});
