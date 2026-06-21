'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';
import {
  parseBackendUserRole,
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
  setAuthSession: (token: string, user: User) => void;
  logout: () => void;
  refreshAuthMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);
const MOCK_DEVELOPER_TOKEN = 'mock-developer-token';

function isLocalPreviewHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function getDashboardPathRole(pathname: string | null): UserRole | null {
  const pathRole = pathname?.match(/^\/dashboard\/([^/]+)/)?.[1];
  return parseStrictUserRole(pathRole);
}

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

    let storedToken = localStorage.getItem('token');
    const disableMock = localStorage.getItem('disable_mock_login') === 'true';
    const isDashboardPath = window.location.pathname.startsWith('/dashboard');
    if (!storedToken && isLocalPreviewHost(window.location.hostname) && (!disableMock || isDashboardPath)) {
      storedToken = MOCK_DEVELOPER_TOKEN;
      localStorage.setItem('token', storedToken);
    }
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
      const resolveMockRole = (): UserRole => {
        const pathRole = getDashboardPathRole(pathname);
        if (pathRole) return pathRole;

        try {
          const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
          const cachedRole = parseStrictUserRole(cachedUser?.role);
          if (cachedRole) return cachedRole;
        } catch {}

        return UserRole.CREATOR;
      };

      try {
        const response = await api.get('/auth/me');
        const authData = response.data?.data ?? response.data;

        if (!authData) {
          throw new Error('No user data from /auth/me');
        }

               const resolvedRole = parseBackendUserRole(authData);
        if (!resolvedRole) {
          throw new Error('Backend user has no recognized role; cannot authorize session.');
        }

        // Allow dev override in localhost development mode
        const isOverrideActive =
          typeof window !== 'undefined' &&
          localStorage.getItem('dev_role_override') === 'true' &&
          isLocalPreviewHost(window.location.hostname);

        let finalRole = resolvedRole;
        if (isOverrideActive) {
          const pathRole = getDashboardPathRole(pathname);
          try {
            const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
            const cachedRole = parseStrictUserRole(cachedUser?.role);
            if (pathRole) {
              finalRole = pathRole;
            } else if (cachedRole) {
              finalRole = cachedRole;
            }
          } catch {}
        }

        const updatedUser: User = {
          id: authData.id,
          name: authData.name,
          role: finalRole,
          onboardingPhase: authData.onboarding?.phase ?? 0,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsBackendVerified(true);
      } catch (error) {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        
        const canUseMockSession =
          typeof window !== 'undefined' &&
          token === MOCK_DEVELOPER_TOKEN &&
          isLocalPreviewHost(window.location.hostname) &&
          window.location.pathname.startsWith('/dashboard');

        // Local development fallback:
        if (status === undefined || canUseMockSession) {
          const mockRole = resolveMockRole();
          console.log(`Using local Mock ${mockRole} session.`);
          
          let mockOnboardingPhase = 0;
          try {
            const mockStatus = JSON.parse(localStorage.getItem('mock_onboarding_status') || 'null');
            if (mockStatus) {
              mockOnboardingPhase = mockStatus.phase;
            }
          } catch {}

          const mockUser: User = {
            id: `mock-${mockRole.toLowerCase()}-id`,
            name: `Demo ${mockRole}`,
            role: mockRole,
            onboardingPhase: mockOnboardingPhase,
          };
          localStorage.setItem('user', JSON.stringify(mockUser));
          setUser(mockUser);
          setIsBackendVerified(true);
          return;
        }

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
  }, [isHydrated, token, router, pathname]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    // Backend wraps responses as { success, message, data }.
    const payload = res.data?.data ?? res.data;
    const { token, user: apiUser } = payload ?? {};

    if (!token || !apiUser) {
      throw new Error(res.data?.message || 'Invalid login response');
    }

    const resolvedRole = parseBackendUserRole(apiUser);
    if (!resolvedRole) {
      throw new Error('Login failed: user has no recognized role assigned. Please contact support.');
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
    localStorage.removeItem('disable_mock_login');

    setUser(user);
    setToken(token);

    router.push(ROLE_DASHBOARD_ROUTES[user.role]);
  };

  const setAuthSession = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('disable_mock_login');
    setToken(token);
    setUser(user);
    setIsBackendVerified(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('dev_role_override');
    localStorage.setItem('disable_mock_login', 'true');
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

      const resolvedRole = parseBackendUserRole(authData);
      if (!resolvedRole) {
        throw new Error('Backend user has no recognized role');
      }

      // Allow dev override in localhost development mode
      const isOverrideActive =
        typeof window !== 'undefined' &&
        localStorage.getItem('dev_role_override') === 'true' &&
        isLocalPreviewHost(window.location.hostname);

      let finalRole = resolvedRole;
      if (isOverrideActive) {
        const pathRole = getDashboardPathRole(pathname);
        try {
          const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
          const cachedRole = parseStrictUserRole(cachedUser?.role);
          if (pathRole) {
            finalRole = pathRole;
          } else if (cachedRole) {
            finalRole = cachedRole;
          }
        } catch {}
      }

      const updatedUser: User = {
        id: authData.id,
        name: authData.name,
        role: finalRole,
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
        isLoading: !isHydrated || (!!token && !isBackendVerified && !user),
        isBackendVerified,
        login,
        setAuthSession,
        logout,
        refreshAuthMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
