import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env.ts', () => {
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = { ...import.meta.env };
  });

  afterEach(() => {
    // Restore original env
    Object.keys(import.meta.env).forEach((key) => {
      delete (import.meta.env as any)[key];
    });
    Object.keys(originalEnv).forEach((key) => {
      (import.meta.env as any)[key] = originalEnv[key];
    });
    vi.resetModules();
  });

  const importFresh = async () => {
    const mod = await import('./env');
    return mod;
  };

  describe('getApiUrl', () => {
    it('returns VITE_API_URL when defined', async () => {
      (import.meta.env as any).VITE_API_URL = 'https://api.example.com';
      const { getApiUrl } = await importFresh();
      expect(getApiUrl()).toBe('https://api.example.com');
    });

    it('throws when VITE_API_URL is missing on module import', async () => {
      delete (import.meta.env as any).VITE_API_URL;
      // ENV object calls getApiUrl() at module load time, so import itself throws
      await expect(import('./env')).rejects.toThrow('VITE_API_URL no está definida');
    });
  });

  describe('httpToWebSocket', () => {
    it('converts http:// to ws://', async () => {
      const { httpToWebSocket } = await importFresh();
      expect(httpToWebSocket('http://localhost:8000')).toBe('ws://localhost:8000');
    });

    it('converts https:// to wss://', async () => {
      const { httpToWebSocket } = await importFresh();
      expect(httpToWebSocket('https://api.example.com')).toBe('wss://api.example.com');
    });

    it('leaves non-http URLs unchanged', async () => {
      const { httpToWebSocket } = await importFresh();
      expect(httpToWebSocket('ftp://files.example.com')).toBe('ftp://files.example.com');
    });

    it('converts mixed URLs correctly', async () => {
      const { httpToWebSocket } = await importFresh();
      expect(httpToWebSocket('http://192.168.1.1:8080/api')).toBe('ws://192.168.1.1:8080/api');
      expect(httpToWebSocket('https://app.domain.com/path?query=1')).toBe('wss://app.domain.com/path?query=1');
    });
  });

  describe('getWebSocketUrl', () => {
    it('derives WebSocket URL from VITE_API_URL', async () => {
      (import.meta.env as any).VITE_API_URL = 'https://api.romero.com';
      const { getWebSocketUrl } = await importFresh();
      expect(getWebSocketUrl()).toBe('wss://api.romero.com');
    });
  });

  describe('API_PREFIX', () => {
    it('is /api/v1', async () => {
      const { API_PREFIX } = await importFresh();
      expect(API_PREFIX).toBe('/api/v1');
    });
  });
});
