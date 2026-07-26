"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Mail, AlertCircle } from "lucide-react";
import InputField from "@/components/auth/InputField";
import PasswordField from "@/components/auth/PasswordField";
import Logo from "@/components/common/Logo";
import { useAuth } from "@/contexts/AuthContext";

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const { user, isAuthenticated, login, logout, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  // Fires both right after a successful login() and on mount if a session cookie already
  // exists (e.g. someone bookmarked this page while signed in). Customer accounts are
  // rejected here rather than left to loop through the middleware redirect.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.roles.includes("customer")) {
      setAccessDenied(true);
      logout();
      return;
    }
    router.replace(redirect);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- logout/router are stable; only re-run when the session itself changes
  }, [isAuthenticated, user, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setAccessDenied(false);
    try {
      await login({ email, password });
    } catch {
      // error already surfaced via context
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <Logo size="md" tone="light" />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            <h1 className="text-lg font-bold text-slate-900">Staff Sign In</h1>
          </div>
          <p className="text-sm text-slate-500 mb-6">Admin &amp; Operations access only.</p>

          {(error || accessDenied) && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{accessDenied ? "This sign-in is for staff accounts only. Please use the customer sign-in instead." : error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <InputField
              label="Email address"
              type="email"
              placeholder="you@d2dholidays.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              disabled={loading}
              required
            />
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <StaffLoginContent />
    </Suspense>
  );
}
