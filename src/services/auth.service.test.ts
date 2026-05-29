import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from './auth.service';
import api from '../config/api';

// Mock del módulo api
vi.mock('../config/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock de cacheService para evitar importar queryClient
vi.mock('./cache.service', () => ({
  cacheService: {
    clearAll: vi.fn(),
  },
}));

describe('authService', () => {
  const mockLocalStorage = (() => {
    const store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('login', () => {
    it('should store token and user on successful login', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-token-123',
          token_type: 'bearer',
        },
      };
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };

      vi.mocked(api.post).mockResolvedValueOnce(mockTokenResponse);
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });

      const result = await authService.login({ email: 'test@example.com', password: 'secret' });

      expect(api.post).toHaveBeenCalledWith(
        '/auth/token',
        expect.any(URLSearchParams),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Skip-Auth-Redirect': '1',
          },
        }
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token-123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(result.access_token).toBe('test-token-123');
      expect(result.user).toEqual(mockUser);
    });

    it('should return token even when user fetch fails', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'test-token-123',
          token_type: 'bearer',
        },
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockTokenResponse);
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.login({ email: 'test@example.com', password: 'secret' });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token-123');
      expect(result.access_token).toBe('test-token-123');
      expect(result.user).toBeUndefined();
    });

    it('should throw error on failed login', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(api.post).mockRejectedValueOnce(error);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call cacheService.clearAll', async () => {
      const { cacheService } = await import('./cache.service');
      await authService.logout();
      expect(cacheService.clearAll).toHaveBeenCalledWith({ preserveKeys: [] });
    });
  });

  describe('getCurrentUser', () => {
    it('should return parsed user from localStorage', () => {
      const user = { id: 1, email: 'test@example.com' };
      mockLocalStorage.setItem('user', JSON.stringify(user));

      const result = authService.getCurrentUser();
      expect(result).toEqual(user);
    });

    it('should return null when no user in localStorage', () => {
      const result = authService.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      mockLocalStorage.setItem('authToken', 'some-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockUser });

      const result = await authService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });
});
