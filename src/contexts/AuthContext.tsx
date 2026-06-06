"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthState, LoginPayload, User } from "@/types/auth";
import { loginApi, socialLoginApi } from "@/services/authService";

const STORAGE_KEY = "d2d.auth.session";
const REMEMBER_KEY = "d2d.auth.remember";

interface PersistedSession {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  socialLogin: (provider: "google" | "facebook") => Promise<void>;
  logout: () => void;
  clearError: () => void;
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
    token: null,
    refreshToken: null,
    loading: false,
    error: null,
  });
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);

  // Hydrate persisted session
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ||
        window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as PersistedSession;
        if (session.expiresAt > Date.now()) {
          setState((s) => ({
            ...s,
            user: session.user,
            token: session.token,
            refreshToken: session.refreshToken,
          }));
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
      }
      setRememberedEmail(window.localStorage.getItem(REMEMBER_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback(
    (session: PersistedSession, remember: boolean) => {
      const value = JSON.stringify(session);
      if (remember) {
        window.localStorage.setItem(STORAGE_KEY, value);
        window.sessionStorage.removeItem(STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(STORAGE_KEY, value);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
    [],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await loginApi(payload);
        const session: PersistedSession = {
          token: res.token,
          refreshToken: res.refreshToken,
          user: res.user,
          expiresAt: Date.now() + res.expiresIn * 1000,
        };
        persist(session, !!payload.rememberMe);
        if (payload.rememberMe) {
          window.localStorage.setItem(REMEMBER_KEY, payload.email);
          setRememberedEmail(payload.email);
        } else {
          window.localStorage.removeItem(REMEMBER_KEY);
          setRememberedEmail(null);
        }
        setState({
          user: res.user,
          token: res.token,
          refreshToken: res.refreshToken,
          loading: false,
          error: null,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Login failed.";
        setState((s) => ({ ...s, loading: false, error: message }));
        throw e;
      }
    },
    [persist],
  );

  const socialLogin = useCallback(
    async (provider: "google" | "facebook") => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await socialLoginApi(provider);
        const session: PersistedSession = {
          token: res.token,
          refreshToken: res.refreshToken,
          user: res.user,
          expiresAt: Date.now() + res.expiresIn * 1000,
        };
        persist(session, true);
        setState({
          user: res.user,
          token: res.token,
          refreshToken: res.refreshToken,
          loading: false,
          error: null,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Social login failed.";
        setState((s) => ({ ...s, loading: false, error: message }));
        throw e;
      }
    },
    [persist],
  );

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    setState({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,
    });
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
      isAuthenticated: !!state.user && !!state.token,
      rememberedEmail,
    }),
    [state, login, socialLogin, logout, clearError, rememberedEmail],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
