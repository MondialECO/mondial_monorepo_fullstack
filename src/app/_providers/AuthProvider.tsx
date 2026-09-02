'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
  parseStrictUserRole,
  resolvePrimaryRole,
  getRoleDashboardRoute,
  resolvePostLoginRedirect,
  ROLE_DASHBOARD_ROUTES,
  UserRole,
} from '@/lib/roles';
import { readOnboardingPhase } from '@/lib/auth-contract';

export type User = {
  id: string;
  name: string;
  role: UserRole; // Primary role for UI defaults / landing
  roles: UserRole[]; // Authoritative complete list of possessed roles
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

function parseAuthorizedRoles(apiRoles: unknown): UserRole[] {
  if (!apiRoles) return [];
  const list = Array.isArray(apiRoles) ? apiRoles : [apiRoles];
  return list.map((r) => parseStrictUserRole(r)).filter((r): r is UserRole => r !== null);
}

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
  const [isVerifyingBackend, setIsVerifyingBackend] = useState(false);
  const router = useRouter();

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
    if (!isHydrated) return;

    if (!token) {
      setIsBackendVerified(false);
      setIsVerifyingBackend(false);
      return;
    }

    let isCancelled = false;

    const verifyToken = async () => {
      setIsVerifyingBackend(true);
      try {
        const response = await api.get('/auth/me');
        const authData = response.data?.data ?? response.data;

        if (!authData) {
          throw new Error('No user data from /auth/me');
        }

        const apiRoles = authData.roles ?? authData.Roles ?? [];
        const parsedRoles = parseAuthorizedRoles(apiRoles);
        if (parsedRoles.length === 0) {
          throw new Error('Backend user has no roles; cannot authorize session');
        }

        const resolvedRole = resolvePrimaryRole(apiRoles) ?? parsedRoles[0];

        const updatedUser: User = {
          id: authData.id,
          name: authData.name,
          role: resolvedRole,
          roles: parsedRoles,
          onboardingPhase: readOnboardingPhase(authData),
        };

        if (isCancelled) return;

        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsBackendVerified(true);
      } catch (error) {
        if (isCancelled) return;

        console.log('Token validation failed, clearing auth:', error instanceof Error ? error.message : String(error));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsBackendVerified(false);
        if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) {
          router.push('/login?reason=invalid_role');
        }
      } finally {
        if (!isCancelled) {
          setIsVerifyingBackend(false);
        }
      }
    };

    verifyToken();

    return () => {
      isCancelled = true;
    };
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
    const parsedRoles = parseAuthorizedRoles(apiRoles);

    // FAIL CLOSED: Reject login if roles are missing
    if (parsedRoles.length === 0) {
      throw new Error('Login failed: user has no valid role assigned. Please contact support.');
    }

    // Use strict role validation; reject unknown roles
    const resolvedRole = resolvePrimaryRole(apiRoles) ?? parsedRoles[0];

    const onboardingPhase = readOnboardingPhase(apiUser);

    const user: User = {
      id: apiUser.id,
      name: apiUser.name,
      role: resolvedRole,
      roles: parsedRoles,
      onboardingPhase,
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);
    setToken(token);
    setIsBackendVerified(true);
    setIsVerifyingBackend(false);

    router.push(resolvePostLoginRedirect(user));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsBackendVerified(false);
    setIsVerifyingBackend(false);
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
      const parsedRoles = parseAuthorizedRoles(apiRoles);
      if (parsedRoles.length === 0) {
        throw new Error('Backend user has no valid roles');
      }

      const resolvedRole = resolvePrimaryRole(apiRoles) ?? parsedRoles[0];

      const updatedUser: User = {
        id: authData.id,
        name: authData.name,
        role: resolvedRole,
        roles: parsedRoles,
        onboardingPhase: readOnboardingPhase(authData),
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
        isLoading: !isHydrated || isVerifyingBackend || (!!token && !isBackendVerified && !user),
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
