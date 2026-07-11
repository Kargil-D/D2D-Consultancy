"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, Mail } from "lucide-react";
import InputField from "@/components/auth/InputField";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { forgotPasswordApi } from "@/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(ForgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setApiError(null);
    setSubmitting(true);
    try {
      await forgotPasswordApi(data.email);
      router.push(`/verify-reset-otp?email=${encodeURIComponent(data.email)}`);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase tracking-widest border border-cyan-100">
        Reset password
      </span>
      <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        Forgot your password?
      </h1>
      <p className="mt-1.5 text-sm text-slate-500 mb-7">
        Enter your account email and we&apos;ll send you a code to reset it.
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
        </AnimatePresence>

        <InputField
          label="Email address"
          type="email"
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
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
              Sending code…
            </>
          ) : (
            <>
              Send reset code
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <p className="text-center text-sm text-slate-500 pt-2">
          <Link href="/login" className="font-semibold text-slate-600 hover:text-slate-900 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
