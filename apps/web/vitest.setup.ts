import '@testing-library/jest-dom/vitest';

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
