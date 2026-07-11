"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import PasswordField from "@/components/auth/PasswordField";
import { ResetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { resetPasswordApi } from "@/services/authService";

const RESET_TICKET_KEY = "d2d.reset.ticket";
const RESET_EMAIL_KEY = "d2d.reset.email";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(ResetPasswordSchema) });

  useEffect(() => {
    const stored = window.sessionStorage.getItem(RESET_TICKET_KEY);
    setTicket(stored);
    if (stored) setValue("resetTicket", stored);
  }, [setValue]);

  const onSubmit = async (data: ResetPasswordInput) => {
    setApiError(null);
    setSubmitting(true);
    try {
      await resetPasswordApi(data.resetTicket, data.newPassword, data.confirmPassword);
      window.sessionStorage.removeItem(RESET_TICKET_KEY);
      window.sessionStorage.removeItem(RESET_EMAIL_KEY);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1200);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (ticket === null) {
    return (
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Reset link expired
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 mb-7">
          Please restart the password reset process.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500"
        >
          Start over
        </Link>
      </div>
    );
  }

  return (
    <div>
      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase tracking-widest border border-cyan-100">
        Reset password
      </span>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        Choose a new password
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 mb-7">
        Make it at least 8 characters, with a mix of upper/lowercase, a digit, and a symbol.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="flex-1">{apiError}</span>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Password updated! Redirecting to sign in…</span>
            </motion.div>
          )}
        </AnimatePresence>

        <input type="hidden" {...register("resetTicket")} />

        <PasswordField
          label="New password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <motion.button
          type="submit"
          disabled={submitting || success}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:shadow-cyan-500/50 transition-all disabled:opacity-70 disabled:cursor-wait"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              Updating…
            </>
          ) : (
            <>
              Update password
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
}
