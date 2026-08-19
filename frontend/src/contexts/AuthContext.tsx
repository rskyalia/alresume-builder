'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  resume_credits: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

export type AuthContextValue = AuthState & AuthActions;

// ─── Cookie helper ────────────────────────────────────────────────────────────

const IS_AUTH_COOKIE = 'is_authenticated';

function setAuthCookie() {
  Cookies.set(IS_AUTH_COOKIE, '1', { path: '/', sameSite: 'lax' });
}

function clearAuthCookie() {
  Cookies.remove(IS_AUTH_COOKIE, { path: '/' });
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Bootstrap: check existing session on mount ────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        type MeResponse =
          | ApiResponse<{ user: User }>
          | ApiResponse<User>;

        const { data: envelope } = await apiClient.get<MeResponse>(
          '/api/auth/me',
        );

        // Backend may return { data: { user } } or { data: user } — handle both
        let resolvedUser: User;
        const payload = envelope.data as { user?: User } & Partial<User>;
        if (payload.user && typeof payload.user === 'object') {
          resolvedUser = payload.user;
        } else {
          resolvedUser = payload as User;
        }

        if (!cancelled) {
          setUser(resolvedUser);
          setAuthCookie();
        }
      } catch {
        // Not authenticated — clear any stale cookie
        clearAuthCookie();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCurrentUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { data: envelope } = await apiClient.post<
      ApiResponse<{ user: User; token: string }>
    >('/api/auth/login', credentials);

    setUser(envelope.data.user);
    setAuthCookie();
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { data: envelope } = await apiClient.post<
      ApiResponse<{ user: User; token: string }>
    >('/api/auth/register', data);

    setUser(envelope.data.user);
    setAuthCookie();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      setUser(null);
      clearAuthCookie();
    }
  }, []);

  // ── Memoised context value ────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      register,
    }),
    [user, isLoading, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Internal hook (used by useAuth.ts) ──────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
