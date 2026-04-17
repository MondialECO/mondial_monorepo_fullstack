"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { UserRole } from "@/lib/roles";

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
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.clear();
      }
    }

    setIsHydrated(true);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user: apiUser } = res.data;

    const user: User = {
      id: apiUser.id,
      name: apiUser.name,
      role: apiUser.roles[0] as UserRole,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);
    setToken(token);

    const roleRoutes: Record<UserRole, string> = {
      Admin: "/dashboard/admin",
      Creator: "/dashboard/creator",
      Investor: "/dashboard/investor",
      Entrepreneur: "/dashboard/entrepreneur",
      ServiceProvider: "/dashboard/serviceprovider",
    };

    router.push(roleRoutes[user.role]);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    router.push("/login");
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
