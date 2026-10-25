import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtimeSync } from '@/lib/use-realtime-sync';

// Mock WebSocket class
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 1; // OPEN
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send = vi.fn();
  close = vi.fn(() => {
    if (this.onclose) this.onclose();
  });
}

describe('useRealtimeSync Hook', () => {
  const originalWebSocket = global.WebSocket;

  beforeEach(() => {
    MockWebSocket.instances = [];
    // @ts-expect-error mock ws
    global.WebSocket = MockWebSocket;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it('connects to websocket and triggers onSync when matching event arrives', () => {
    const onSyncMock = vi.fn();
    renderHook(() => useRealtimeSync(onSyncMock, { entity: 'reports' }));

    expect(MockWebSocket.instances.length).toBe(1);
    const ws = MockWebSocket.instances[0];
    expect(ws.url).toContain('/api/v1/ws');

    // Simulate incoming report event
    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({ type: 'REPORT_CREATED', entity: 'reports', id: 101 }),
      });
    });

    expect(onSyncMock).toHaveBeenCalledTimes(1);
  });

  it('ignores events for other entities when filtered', () => {
    const onSyncMock = vi.fn();
    renderHook(() => useRealtimeSync(onSyncMock, { entity: 'reports' }));

    const ws = MockWebSocket.instances[0];

    // Simulate unrelated announcement event
    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({ type: 'ANNOUNCEMENT_PUBLISHED', entity: 'announcements' }),
      });
    });

    expect(onSyncMock).not.toHaveBeenCalled();
  });

  it('triggers onSync on document visibility change', () => {
    const onSyncMock = vi.fn();
    renderHook(() => useRealtimeSync(onSyncMock, { entity: '*' }));

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(onSyncMock).toHaveBeenCalled();
  });

  it('triggers periodic sync on interval fallback', () => {
    const onSyncMock = vi.fn();
    renderHook(() => useRealtimeSync(onSyncMock, { intervalMs: 3000 }));

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(onSyncMock).toHaveBeenCalled();
  });
});
