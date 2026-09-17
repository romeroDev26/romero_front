import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mocks ───

const mockToastInfo = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastWarning = vi.fn();

vi.mock('@/utils/sileo-toast', () => ({
  toast: {
    info: (...args: unknown[]) => mockToastInfo(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args),
  },
}));

vi.mock('../config/env', () => ({
  getWebSocketUrl: () => 'ws://localhost:8000',
  API_PREFIX: '/api/v1',
}));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];
  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: ((ev?: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev?: Event) => void) | null = null;
  sentMessages: any[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentMessages.push(JSON.parse(data));
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code, reason, wasClean: code === 1000 } as CloseEvent);
    }
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  static clear() {
    MockWebSocket.instances = [];
  }

  static last(): MockWebSocket {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }
}

Object.defineProperty(globalThis, 'WebSocket', {
  writable: true,
  value: MockWebSocket,
});

describe('useWebSocketNotifications', () => {
  const authToken = 'test-token-123';

  beforeEach(() => {
    MockWebSocket.clear();
    mockToastInfo.mockClear();
    mockToastSuccess.mockClear();
    mockToastWarning.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.setItem('authToken', authToken);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const importHook = async () => {
    vi.resetModules();
    const mod = await import('./useWebSocketNotifications');
    return mod.useWebSocketNotifications;
  };

  it('does not connect when enabled is false', async () => {
    const useWebSocketNotifications = await importHook();
    renderHook(() => useWebSocketNotifications({ enabled: false }));
    expect(MockWebSocket.instances.length).toBe(0);
  });

  it('connects on mount and builds URL with token', async () => {
    const useWebSocketNotifications = await importHook();
    renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws = MockWebSocket.last();
    expect(ws.url).toContain('/api/v1/ws/notifications');
    expect(ws.url).toContain(`token=${encodeURIComponent(authToken)}`);
  });

  it('does not connect when token is missing', async () => {
    localStorage.removeItem('authToken');
    const useWebSocketNotifications = await importHook();
    renderHook(() => useWebSocketNotifications({ enabled: true }));

    // Allow any async effects to settle
    act(() => vi.advanceTimersByTime(500));
    expect(MockWebSocket.instances.length).toBe(0);
  });

  it('sets isConnected to true after open', async () => {
    const useWebSocketNotifications = await importHook();
    const { result } = renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws = MockWebSocket.last();

    expect(result.current.isConnected).toBe(false);
    act(() => ws.simulateOpen());
    expect(result.current.isConnected).toBe(true);
  });

  it('handles CANCELLATION_REQUEST_CREATED with toast, handler and custom event', async () => {
    const useWebSocketNotifications = await importHook();
    const onCreated = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

    renderHook(() =>
      useWebSocketNotifications({
        enabled: true,
        onCancellationRequestCreated: onCreated,
      })
    );

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    act(() =>
      ws.simulateMessage({
        type: 'CANCELLATION_REQUEST_CREATED',
        data: {
          id: 1,
          requesterName: 'Seller A',
          invoice: 'F001-123',
          message: 'New request',
          passenger_name: 'John Doe',
          trip_info: 'IQT-LIM',
        },
      })
    );

    expect(mockToastInfo).toHaveBeenCalledWith(
      expect.stringContaining('New request'),
      expect.objectContaining({ position: 'top-right' })
    );
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 1, requesterName: 'Seller A' }));
    expect(dispatchSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchSpy.mock.calls[dispatchSpy.mock.calls.length - 1][0] as CustomEvent;
    expect(dispatchedEvent.type).toBe('cancellation-request-created');

    dispatchSpy.mockRestore();
  });

  it('handles CANCELLATION_REQUEST_RESOLVED APPROVED with success toast', async () => {
    const useWebSocketNotifications = await importHook();
    const onResolved = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

    renderHook(() =>
      useWebSocketNotifications({
        enabled: true,
        onCancellationRequestResolved: onResolved,
      })
    );

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    act(() =>
      ws.simulateMessage({
        type: 'CANCELLATION_REQUEST_RESOLVED',
        data: {
          id: 2,
          status: 'APPROVED',
          message: 'Approved!',
          credit_note_series: 'NC01',
          credit_note_number: 99,
        },
      })
    );

    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Approved!'),
      expect.objectContaining({ autoClose: 6000 })
    );
    expect(onResolved).toHaveBeenCalledWith(expect.objectContaining({ id: 2, status: 'APPROVED' }));
    expect(dispatchSpy).toHaveBeenCalled();

    dispatchSpy.mockRestore();
  });

  it('handles CANCELLATION_REQUEST_RESOLVED REJECTED with warning toast', async () => {
    const useWebSocketNotifications = await importHook();

    renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    act(() =>
      ws.simulateMessage({
        type: 'CANCELLATION_REQUEST_RESOLVED',
        data: {
          id: 3,
          status: 'REJECTED',
          message: 'Rejected!',
          rejection_reason: 'Too late',
        },
      })
    );

    expect(mockToastWarning).toHaveBeenCalledWith(
      expect.stringContaining('Rejected!'),
      expect.objectContaining({ autoClose: 8000 })
    );
  });

  it('reconnects automatically on unexpected close', async () => {
    const useWebSocketNotifications = await importHook();
    renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws1 = MockWebSocket.last();
    act(() => ws1.simulateOpen());

    act(() => ws1.close(1006));

    // Exponential backoff: 1000 * 2^0 = 1000
    act(() => vi.advanceTimersByTime(1500));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(2));
  });

  it('does not reconnect on auth error (code 1008)', async () => {
    const useWebSocketNotifications = await importHook();
    renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws1 = MockWebSocket.last();
    act(() => ws1.simulateOpen());

    act(() => ws1.close(1008));

    act(() => vi.advanceTimersByTime(60000));
    expect(MockWebSocket.instances.length).toBe(1);
  });

  it('PONG does not trigger toast or handlers', async () => {
    const useWebSocketNotifications = await importHook();
    renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    act(() => ws.simulateMessage({ type: 'PONG' }));

    expect(mockToastInfo).not.toHaveBeenCalled();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it('sends PING via heartbeat after open', async () => {
    const useWebSocketNotifications = await importHook();
    renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    act(() => vi.advanceTimersByTime(31000));
    expect(ws.sentMessages.some((m: any) => m.type === 'PING')).toBe(true);
  });

  it('cleans up connection listener on unmount', async () => {
    const useWebSocketNotifications = await importHook();
    const { unmount } = renderHook(() => useWebSocketNotifications({ enabled: true }));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));
    unmount();

    // After unmount, closing the socket should not throw
    const ws = MockWebSocket.last();
    expect(() => act(() => ws.close(1000))).not.toThrow();
  });
});
