'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';
import {
  parseStrictUserRole,
  ROLE_DASHBOARD_ROUTES,
  UserRole,
} from '@/lib/roles';

type User = {
  id: string;
  name: string;
  role: UserRole;
  onboardingPhase?: number; // Universal Phase 1 gate (0 = not started, 1 = complete)
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBackendVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuthMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isBackendVerified, setIsBackendVerified] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate token from localStorage only (never authorize from cached user)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedToken = localStorage.getItem('token');
    queueMicrotask(() => {
      if (storedToken) {
        setToken(storedToken);
      }
      setIsHydrated(true);
    });
  }, []);

  // Sync token across multiple tabs/windows
  useEffect(() => {
    const syncAuth = () => {
      const tokenFromStorage = localStorage.getItem('token');
      if (!tokenFromStorage) {
        setToken(null);
        setUser(null);
        setIsBackendVerified(false);
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // Verify token with backend after hydration (must succeed before authorizing dashboard)
  useEffect(() => {
    if (!isHydrated || !token) {
      setIsBackendVerified(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get('/auth/me');
        const authData = response.data?.data ?? response.data;

        if (!authData) {
          throw new Error('No user data from /auth/me');
        }

        const apiRoles = authData.roles ?? authData.Roles ?? [];
        if (!apiRoles || apiRoles.length === 0) {
          throw new Error('Backend user has no roles; cannot authorize session');
        }

        const resolvedRole = parseStrictUserRole(apiRoles[0]);
        if (!resolvedRole) {
          throw new Error(`Unknown role from backend: "${apiRoles[0]}". Cannot authorize session.`);
        }

        const updatedUser: User = {
          id: authData.id,
          name: authData.name,
          role: resolvedRole,
          onboardingPhase: authData.onboarding?.phase ?? 0,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsBackendVerified(true);
      } catch (error) {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        const shouldExpireSession = status === 401 || status === 403;

        console.log('Token validation failed, clearing auth:', error instanceof Error ? error.message : String(error));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsBackendVerified(false);
        if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) {
          router.push('/login?reason=invalid_role');
        }
      }
    };

    verifyToken();
  }, [isHydrated, token, router]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    // Backend wraps responses as { success, message, data }.
    const payload = res.data?.data ?? res.data;
    const { token, user: apiUser } = payload ?? {};

    if (!token || !apiUser) {
      throw new Error(res.data?.message || 'Invalid login response');
    }

    const apiRoles = apiUser.roles ?? apiUser.Roles ?? [];

    // FAIL CLOSED: Reject login if roles are missing
    if (!apiRoles || apiRoles.length === 0) {
      throw new Error('Login failed: user has no role assigned. Please contact support.');
    }

    // Use strict role validation; reject unknown roles
    const resolvedRole = parseStrictUserRole(apiRoles[0]);
    if (!resolvedRole) {
      throw new Error(`Login failed: unknown role "${apiRoles[0]}". Please contact support.`);
    }

    // Capture onboarding phase from login response (backend includes it at apiUser.Onboarding.phase)
    const onboardingPhase = apiUser.Onboarding?.phase ?? 0;

    const user: User = {
      id: apiUser.id,
      name: apiUser.name,
      role: resolvedRole,
      onboardingPhase,
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);
    setToken(token);

    router.push(ROLE_DASHBOARD_ROUTES[user.role]);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsBackendVerified(false);
    router.replace('/login');
  };

  const refreshAuthMe = async () => {
    if (!token) return;

    try {
      const response = await api.get('/auth/me');
      const authData = response.data?.data ?? response.data;

      if (!authData) {
        throw new Error('No user data from /auth/me');
      }

      const apiRoles = authData.roles ?? authData.Roles ?? [];
      if (!apiRoles || apiRoles.length === 0) {
        throw new Error('Backend user has no roles');
      }

      const resolvedRole = parseStrictUserRole(apiRoles[0]);
      if (!resolvedRole) {
        throw new Error(`Unknown role: "${apiRoles[0]}"`);
      }

      const updatedUser: User = {
        id: authData.id,
        name: authData.name,
        role: resolvedRole,
        onboardingPhase: authData.onboarding?.phase ?? 0,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!user && !!token && isBackendVerified,
        isLoading: !isHydrated,
        isBackendVerified,
        login,
        logout,
        refreshAuthMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
