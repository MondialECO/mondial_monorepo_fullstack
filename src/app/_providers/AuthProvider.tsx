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
  // True while the initial /auth/me verification is in flight, so the AuthGuard
  // shows a loading state instead of bouncing a valid session to /login during
  // the round-trip or while retrying a transient failure (e.g. a 429).
  const [isVerifying, setIsVerifying] = useState(true);
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
    if (!isHydrated) return; // still hydrating — keep isVerifying true (shows loading)
    if (!token) {
      setIsBackendVerified(false);
      setIsVerifying(false);
      return;
    }

    let cancelled = false;
    setIsVerifying(true);

    const expireSession = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsBackendVerified(false);
      if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) {
        router.push('/login?reason=session_expired');
      }
    };

    const verifyToken = async () => {
      // Retry transient failures (429 rate-limit, 5xx, network) instead of
      // discarding the session. ONLY a definitive 401/403 expires the token —
      // a rate-limited /auth/me must never log a valid user out.
      const MAX_ATTEMPTS = 3;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const response = await api.get('/auth/me');
          if (cancelled) return;
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
          return;
        } catch (error) {
          if (cancelled) return;
          const status = isAxiosError(error) ? error.response?.status : undefined;

          // Definitive auth failure: the token was rejected. Expire the session.
          if (status === 401 || status === 403) {
            expireSession();
            return;
          }

          // Transient failure — back off and retry; never discard the token.
          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
            continue;
          }

          // Retries exhausted (e.g. sustained 429). Keep the still-valid token
          // and fall back to the cached identity so a logged-in user is not
          // bounced to /login over a transient backend hiccup.
          console.warn('[auth] /auth/me transient failure; keeping session.', status);
          const cachedUser =
            typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser) as User);
              setIsBackendVerified(true);
              return;
            } catch {
              // malformed cache — fall through
            }
          }
          // No cached identity: leave the token intact but unverified (do NOT
          // logout). A later navigation re-runs this verification.
          setIsBackendVerified(false);
          return;
        }
      }
    };

    verifyToken().finally(() => {
      if (!cancelled) setIsVerifying(false);
    });

    return () => {
      cancelled = true;
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
      // Only a definitive 401/403 means the token is invalid — log out then.
      // A transient failure (e.g. a 429 rate-limit right after onboarding
      // completion) must NOT log the user out; keep the current session.
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401 || status === 403) {
        logout();
        return;
      }
      console.warn('[auth] refreshAuthMe transient failure; keeping session.', status);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!user && !!token && isBackendVerified,
        isLoading: !isHydrated || isVerifying,
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
