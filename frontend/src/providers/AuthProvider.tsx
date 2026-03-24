'use client';

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch('/api/users/me', { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setUser(json.success ? json.data : null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(json.error || 'Login failed');
      }

      // Refetch user profile after login
      const meRes = await fetch('/api/users/me', { credentials: 'include' });
      if (meRes.ok) {
        const meJson = await meRes.json();
        setUser(meJson.success ? meJson.data : null);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Proceed with client-side cleanup even if request fails
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-bb-blue rounded-lg px-6 py-3 shadow-xl">
              <span className="text-2xl font-extrabold tracking-tight text-bb-accent">
                BLOCKBUSTER
              </span>
            </div>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
