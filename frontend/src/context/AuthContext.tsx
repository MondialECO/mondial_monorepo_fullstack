"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { UserRole } from "@/lib/roles";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/role-routes";

type User = {
  id: string;
  name: string;
  /** Primary role used for routing. */
  role: UserRole;
  /** All roles the user holds. */
  roles: UserRole[];
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Return a safe default during SSR/hydration instead of throwing immediately
  if (!context) {
    // Only throw in development for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Return a temporary default to allow component to render, then warn
      console.warn('[useAuth] Warning: Called outside AuthProvider. This component will not work properly.');
    }
    
    // Return a safe default structure to prevent crashes
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start in loading state so UI shows "Loading..."
      login: async () => { throw new Error('useAuth: AuthProvider not available'); },
      logout: () => { throw new Error('useAuth: AuthProvider not available'); },
      hasRole: () => false,
    };
  }

  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Hydrate from localStorage only once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        queueMicrotask(() => {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        });
      } catch {
        localStorage.clear();
      }
    }

    setIsHydrated(true);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    // Backend wraps every response in { success, message, data }.
    const payload = res.data?.data ?? res.data;
    const { token, user: apiUser } = payload;

    if (!token || !apiUser) {
      throw new Error("Invalid login response");
    }

    const roles = (apiUser.roles ?? apiUser.Roles ?? []) as UserRole[];

    const user: User = {
      id: apiUser.id,
      name: apiUser.name,
      role: (roles[0] ?? UserRole.CREATOR) as UserRole,
      roles,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    setToken(token);

    router.push(ROLE_DASHBOARD_ROUTES[user.role] ?? "/dashboard");
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  const hasRole = (role: UserRole) => !!user?.roles?.includes(role);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!user && !!token,
        isLoading: !isHydrated,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
