"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import PasswordField from "@/components/auth/PasswordField";
import Logo from "@/components/common/Logo";
import { EmployeeInviteAcceptSchema, type EmployeeInviteAcceptInput } from "@/lib/validation/employeeInvite";
import { verifyEmployeeInviteApi, acceptEmployeeInviteApi } from "@/services/authService";

function EmployeeInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [invitee, setInvitee] = useState<{ fullName: string; email: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeInviteAcceptInput>({
    resolver: zodResolver(EmployeeInviteAcceptSchema),
    defaultValues: { token },
  });

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    verifyEmployeeInviteApi(token)
      .then((data) => {
        setInvitee(data);
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const onSubmit = async (data: EmployeeInviteAcceptInput) => {
    setApiError(null);
    setSubmitting(true);
    try {
      await acceptEmployeeInviteApi(token, data.password, data.confirmPassword);
      setSuccess(true);
      setTimeout(() => router.push("/admin/login"), 1500);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Could not complete registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <Logo size="md" tone="light" />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl">
          {status === "checking" && (
            <p className="text-sm text-slate-500 text-center py-6">Checking your invite…</p>
          )}

          {status === "invalid" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h1 className="text-lg font-bold text-slate-900">Invite link invalid</h1>
              </div>
              <p className="text-sm text-slate-500">
                This invite link is invalid, expired, or already used. Ask your Admin to send a new one.
              </p>
            </>
          )}

          {status === "valid" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-cyan-600" />
                <h1 className="text-lg font-bold text-slate-900">Set up your login</h1>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                Hi {invitee?.fullName} — choose a password for {invitee?.email}. Only you will know it.
              </p>

              {apiError && (
                <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Login created! Redirecting to sign in…</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <input type="hidden" {...register("token")} value={token} />
                <PasswordField
                  label="Password"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register("password")}
                />
                <PasswordField
                  label="Confirm password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                <button
                  type="submit"
                  disabled={submitting || success}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Setting up…" : "Set password & continue"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmployeeInvitePage() {
  return (
    <Suspense>
      <EmployeeInviteContent />
    </Suspense>
  );
}
