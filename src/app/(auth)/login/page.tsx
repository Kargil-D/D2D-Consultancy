"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();
  const redirect = searchParams.get("redirect") || "/";

  // If a silent token refresh already re-authenticated this session (see
  // AuthContext.refreshUser), skip the form entirely and go straight there.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirect);
    }
  }, [loading, isAuthenticated, redirect, router]);

  return (
    <div>
      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase tracking-widest border border-cyan-100">
        Member access
      </span>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 mb-7">
        Sign in to access your saved trips, quotes and bookings.
      </p>

      <LoginForm
        onSuccess={() => router.push(redirect)}
        onForgotPassword={() => router.push("/forgot-password")}
        onRegister={() => router.push("/register")}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
