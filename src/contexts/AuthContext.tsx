"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthState, LoginPayload } from "@/types/auth";
import { loginApi, logoutApi, meApi, socialLoginApi } from "@/services/authService";

const REMEMBER_KEY = "d2d.auth.remember";

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  socialLogin: (provider: "google" | "facebook") => Promise<void>;
  logout: () => void;
  clearError: () => void;
  /** Re-fetches /api/auth/me — call after a flow that authenticates outside of login() (e.g. verify-email auto-login). */
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  rememberedEmail: string | null;
}

const Ctx = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await meApi();
      setState((s) => ({ ...s, user }));
    } catch {
      setState((s) => ({ ...s, user: null }));
    }
  }, []);

  // The session itself lives in httpOnly cookies (set by the API on
  // login/verify-email/refresh) — hydrate `user` by asking the server who's
  // currently authenticated instead of reading anything from localStorage.
  useEffect(() => {
    refreshUser();

    if (typeof window !== "undefined") {
      setRememberedEmail(window.localStorage.getItem(REMEMBER_KEY));
    }
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { user } = await loginApi(payload);
      if (payload.rememberMe) {
        window.localStorage.setItem(REMEMBER_KEY, payload.email);
        setRememberedEmail(payload.email);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
        setRememberedEmail(null);
      }
      setState({ user, loading: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed.";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw e;
    }
  }, []);

  const socialLogin = useCallback(async (provider: "google" | "facebook") => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { user } = await socialLoginApi(provider);
      setState({ user, loading: false, error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Social login failed.";
      setState((s) => ({ ...s, loading: false, error: message }));
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    logoutApi().catch(() => {
      /* cookies are cleared client-side regardless below */
    });
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(
    () => setState((s) => ({ ...s, error: null })),
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      socialLogin,
      logout,
      clearError,
      refreshUser,
      isAuthenticated: !!state.user,
      rememberedEmail,
    }),
    [state, login, socialLogin, logout, clearError, refreshUser, rememberedEmail],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
