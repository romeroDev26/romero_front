import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { WebSocketConfig, SeatUpdateMessage } from '../types/websocket.types';

// Mock env module to avoid import.meta.env dependency
vi.mock('../../../config/env', () => ({
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

describe('useWebSocketConnection', () => {
  const config: WebSocketConfig = {
    tripId: 1,
    userId: 'user-123',
    userName: 'Test User',
    enabled: true,
    maxReconnectAttempts: 2,
  };

  const onMessage = vi.fn();

  beforeEach(() => {
    MockWebSocket.clear();
    onMessage.mockClear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not auto-connect on initial mount', () => {
    renderHook(() => useWebSocketConnection(config, onMessage));
    expect(MockWebSocket.instances.length).toBe(0);
  });

  it('connects via forceReconnect', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
    });

    const ws = MockWebSocket.last();
    expect(ws.url).toContain('/api/v1/ws/seats/1');
    expect(ws.url).toContain('user_id=user-123');
    expect(ws.url).toContain('user_name=Test%20User');
  });

  it('sends CONNECT and REQUEST_INITIAL_STATE after open', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    expect(ws.sentMessages).toContainEqual({ type: 'CONNECT' });

    act(() => vi.advanceTimersByTime(600));
    expect(ws.sentMessages).toContainEqual({ type: 'REQUEST_INITIAL_STATE' });
  });

  it('forwards non-PONG messages to onMessage callback', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    const msg: SeatUpdateMessage = {
      type: 'SEAT_UPDATE',
      tripId: 1,
      seatId: 5,
      status: 'SOLD',
      timestamp: new Date().toISOString(),
    };
    act(() => ws.simulateMessage(msg));

    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'SEAT_UPDATE', seatId: 5 }));
  });

  it('handles PONG without calling onMessage and updates latency', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    act(() => {
      ws.simulateMessage({
        type: 'PONG',
        tripId: 1,
        timestamp: Date.now() - 50,
      });
    });

    expect(onMessage).not.toHaveBeenCalled();
    expect(result.current.latency).toBeGreaterThanOrEqual(0);
  });

  it('sendMessage returns true when socket is open', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    let sent = false;
    act(() => {
      sent = result.current.sendMessage({ type: 'TEST' });
    });

    expect(sent).toBe(true);
    expect(ws.sentMessages).toContainEqual({ type: 'TEST' });
  });

  it('sendMessage returns false when socket is not open', () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    let sent = true;
    act(() => {
      sent = result.current.sendMessage({ type: 'TEST' });
    });

    expect(sent).toBe(false);
  });

  it('reconnects automatically on unexpected close', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws1 = MockWebSocket.last();
    act(() => ws1.simulateOpen());

    // Simulate unexpected close (code 1006)
    act(() => ws1.close(1006, 'Abnormal'));

    // Should schedule reconnect
    act(() => vi.advanceTimersByTime(4000));

    await waitFor(() => expect(MockWebSocket.instances.length).toBe(2));
  });

  it('does not reconnect after max attempts and sets status to failed', async () => {
    const { result } = renderHook(() =>
      useWebSocketConnection({ ...config, maxReconnectAttempts: 1 }, onMessage)
    );

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws1 = MockWebSocket.last();
    act(() => ws1.simulateOpen());
    act(() => ws1.close(1006));

    // First reconnect attempt
    act(() => vi.advanceTimersByTime(5000));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(2));

    const ws2 = MockWebSocket.last();
    act(() => ws2.close(1006));

    // Should exceed max attempts
    act(() => vi.advanceTimersByTime(10000));

    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('failed');
      expect(result.current.isWebSocketAvailable).toBe(false);
    });
  });

  it('does not reconnect on intentional close (code 1000)', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());
    act(() => ws.close(1000, 'Intentional'));

    act(() => vi.advanceTimersByTime(20000));
    expect(MockWebSocket.instances.length).toBe(1);
  });

  it('forceReconnect resets state and reconnects', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws1 = MockWebSocket.last();
    act(() => ws1.simulateOpen());
    act(() => ws1.close(1006));

    act(() => vi.advanceTimersByTime(5000));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(2));

    // Force reconnect
    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));

    await waitFor(() => {
      expect(result.current.reconnectAttempts).toBe(0);
      expect(result.current.isWebSocketAvailable).toBe(true);
    });
  });

  it('pingConnection sends PING', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws = MockWebSocket.last();
    act(() => ws.simulateOpen());

    act(() => result.current.pingConnection());

    expect(ws.sentMessages.some((m: any) => m.type === 'PING')).toBe(true);
  });

  it('closes socket and clears timers on unmount', async () => {
    const { result, unmount } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws = MockWebSocket.last();
    const closeSpy = vi.spyOn(ws, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalledWith(1000, 'Component unmounting');
  });

  it('uses faster reconnect delay for code 1005', async () => {
    const { result } = renderHook(() => useWebSocketConnection(config, onMessage));

    act(() => result.current.forceReconnect());
    act(() => vi.advanceTimersByTime(200));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(1));

    const ws1 = MockWebSocket.last();
    act(() => ws1.simulateOpen());
    act(() => ws1.close(1005));

    // Code 1005 should use faster delay (min 1000*attempt, 5000)
    act(() => vi.advanceTimersByTime(1500));
    await waitFor(() => expect(MockWebSocket.instances.length).toBe(2));
  });
});
