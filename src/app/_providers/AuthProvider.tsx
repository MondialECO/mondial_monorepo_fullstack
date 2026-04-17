'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';
import { UserRole } from '@/lib/roles';

type User = {
  id: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate from localStorage only once on mount (client-side only)
  useEffect(() => {
    // Ensure this only runs on the client
    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.clear();
      }
    }

    setIsHydrated(true);
  }, []);

  // Sync auth state across multiple tabs/windows
  useEffect(() => {
    const syncAuth = () => {
      const tokenFromStorage = localStorage.getItem('token');
      const userFromStorage = localStorage.getItem('user');

      if (tokenFromStorage && userFromStorage) {
        try {
          setToken(tokenFromStorage);
          setUser(JSON.parse(userFromStorage));
        } catch {
          localStorage.clear();
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  // Verify token is valid on backend when app loads
  useEffect(() => {
    if (!isHydrated || !token) return;
    if (!pathname?.startsWith('/dashboard')) return;

    const verifyToken = async () => {
      try {
        // Verify token with backend
        await api.get('/auth/me');
        // Token is valid, continue
      } catch (err) {
        // Token is invalid or expired, clear auth and redirect
        console.log('Token validation failed, clearing auth');
        localStorage.clear();
        setUser(null);
        setToken(null);
        // Only redirect if we're on a dashboard page
        if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard')) {
          router.push('/login?reason=session_expired');
        }
      }
    };

    // Only verify once after hydration
    verifyToken();
  }, [isHydrated]); // Only run when isHydrated changes to true

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: apiUser } = res.data;

    const user: User = {
      id: apiUser.id,
      name: apiUser.name,
      role: apiUser.roles[0] as UserRole,
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);
    setToken(token);

    const roleRoutes: Record<UserRole, string> = {
      Admin: '/dashboard/admin',
      Creator: '/dashboard/creator',
      Investor: '/dashboard/investor',
      Entrepreneur: '/dashboard/entrepreneur',
      ServiceProvider: '/dashboard/serviceprovider',
    };

    router.push(roleRoutes[user.role]);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!user && !!token,
        isLoading: !isHydrated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}