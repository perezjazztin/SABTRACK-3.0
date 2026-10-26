'use client';

import { useEffect, useRef } from 'react';
import { API_BASE_URL } from './config';

export interface RealtimeSyncOptions {
  entity?: 'reports' | 'announcements' | 'schedules' | 'claims' | 'initiatives' | '*';
  intervalMs?: number; // Background polling fallback interval (default: 2000ms < 3 sec refresh rate)
  enabled?: boolean;
}

/**
 * React hook that triggers automatic real-time data synchronization.
 *
 * Combines:
 * 1. Immediate WebSocket event push (near 0ms latency).
 * 2. Instant tab focus / visibilitychange refetch (instant update when returning to tab).
 * 3. Fast resilient background polling interval (< 3 seconds, default 2000ms).
 */
export function useRealtimeSync(
  onSync: () => void | Promise<void>,
  options: RealtimeSyncOptions = {}
) {
  const { entity = '*', intervalMs = 2000, enabled = true } = options;
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!enabled) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let isCleanedUp = false;

    const connectWs = () => {
      if (typeof window === 'undefined' || isCleanedUp) return;

      try {
        const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/api/v1/ws';
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          heartbeatTimer = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'CONNECTED' || event.data === 'pong') return;

            // Trigger sync if matching target entity or wildcard
            if (
              entity === '*' ||
              data.entity === entity ||
              (typeof data.type === 'string' && data.type.toLowerCase().includes(entity.toLowerCase()))
            ) {
              onSyncRef.current();
            }
          } catch {
            // Non-JSON packet, ignore
          }
        };

        ws.onclose = () => {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          if (!isCleanedUp) {
            reconnectTimer = setTimeout(connectWs, 2000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        // Fallback gracefully to polling
      }
    };

    connectWs();

    // Instant hydration on window focus or tab visibility change
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        onSyncRef.current();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Background interval heartbeat fallback
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        onSyncRef.current();
      }
    }, intervalMs);

    return () => {
      isCleanedUp = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [entity, intervalMs, enabled]);
}
