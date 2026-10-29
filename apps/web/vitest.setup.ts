import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Safe mock for WebSocket in jsdom test runs to prevent unhandled undici connection errors
if (typeof window !== 'undefined') {
  class MockWebSocket {
    url: string;
    readyState = 1; // OPEN
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor(url: string) {
      this.url = url;
    }

    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
  }

  // @ts-expect-error mock ws
  global.WebSocket = MockWebSocket;
  // @ts-expect-error mock ws on window
  window.WebSocket = MockWebSocket;
}

// Safe mock for next/font/google in test runs
const mockFont = (name: string) => () => ({
  className: `font-${name}`,
  variable: `--font-${name}`,
});

vi.mock('next/font/google', () => ({
  Raleway: mockFont('raleway'),
  Inter: mockFont('inter'),
  Bricolage_Grotesque: mockFont('bricolage'),
  Figtree: mockFont('figtree'),
  Outfit: mockFont('outfit'),
  Plus_Jakarta_Sans: mockFont('plus-jakarta-sans'),
}));


