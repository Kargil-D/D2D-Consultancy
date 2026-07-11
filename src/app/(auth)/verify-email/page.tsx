"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import InputField from "@/components/auth/InputField";
import { useOtpCountdown } from "@/components/auth/useOtpCountdown";
import { verifyEmailApi, resendOtpApi } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

function VerifyEmailForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const { refreshUser } = useAuth();
  const { remaining, canResend, restart } = useOtpCountdown();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      await verifyEmailApi(email, otp);
      await refreshUser();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await resendOtpApi(email, "Registration");
      setInfo("A new code has been sent.");
      restart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase tracking-widest border border-cyan-100">
        Verify email
      </span>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        Check your inbox
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 mb-7">
        We sent a 6-digit code to <strong>{email || "your email"}</strong>. Enter it below to
        activate your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
            </motion.div>
          )}
          {info && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
            >
              <span className="flex-1">{info}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <InputField
          label="Verification code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          icon={<ShieldCheck className="w-4 h-4" />}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={submitting}
        />

        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:shadow-cyan-500/50 transition-all disabled:opacity-70 disabled:cursor-wait"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              Verify &amp; continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <p className="text-center text-sm text-slate-500 pt-2">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || resending}
            className="font-bold text-cyan-700 hover:text-cyan-900 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            {canResend ? "Resend code" : `Resend in ${remaining}s`}
          </button>
        </p>

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-semibold text-slate-600 hover:text-slate-900 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
