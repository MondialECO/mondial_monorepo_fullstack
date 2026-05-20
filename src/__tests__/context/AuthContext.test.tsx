import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';
import api from '@/lib/axios';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock axios
vi.mock('@/lib/axios');

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useAuth Hook', () => {
    it('should provide default values when used outside AuthProvider', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load user from localStorage on mount', () => {
      const mockUser = { id: 'user-123', name: 'John Doe', role: 'Entrepreneur' as const };
      const mockToken = 'test-token-123';

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', mockToken);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe(mockToken);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('AuthProvider', () => {
    it('should provide initial state correctly', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should handle successful login', async () => {
      const mockResponse = {
        token: 'new-token-123',
        user: {
          id: 'user-123',
          name: 'Jane Doe',
          roles: ['Entrepreneur'],
        },
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('jane@example.com', 'password123');
      });

      waitFor(() => {
        expect(result.current.user).toEqual({
          id: 'user-123',
          name: 'Jane Doe',
          role: 'Entrepreneur',
        });
        expect(result.current.token).toBe('new-token-123');
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(localStorage.getItem('token')).toBe('new-token-123');
      expect(localStorage.getItem('user')).toBeDefined();
    });

    it('should handle login with different roles', async () => {
      const mockResponse = {
        token: 'admin-token',
        user: {
          id: 'admin-1',
          name: 'Admin User',
          roles: ['Admin'],
        },
      };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('admin@example.com', 'password');
      });

      waitFor(() => {
        expect(result.current.user?.role).toBe('Admin');
      });
    });

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(api.post).mockRejectedValueOnce(mockError);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('wrong@example.com', 'wrongpassword');
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should clear localStorage on logout', async () => {
      const mockUser = { id: 'user-123', name: 'John Doe', role: 'Entrepreneur' as const };
      const mockToken = 'test-token-123';

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', mockToken);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.logout();
      });

      waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('user', 'invalid-json{]');
      localStorage.setItem('token', 'test-token');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Should clear localStorage on parsing error
      waitFor(() => {
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
      });
    });
  });
});
