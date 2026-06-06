"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Mail,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import InputField from "@/components/auth/InputField";
import PasswordField from "@/components/auth/PasswordField";
import AnimatedBackground from "@/components/auth/AnimatedBackground";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(
  name: string,
  email: string,
  password: string,
  confirm: string
): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = "Full name is required.";
  if (!email.trim()) errors.email = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6)
    errors.password = "Password must be at least 6 characters.";
  if (confirm !== password) errors.confirm = "Passwords do not match.";
  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const fieldErrors = validate(name, email, password, confirm);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    if (!agree) {
      setApiError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    try {
      setLoading(true);
      // Mocked registration — wire to /api/auth/register later.
      await new Promise((r) => setTimeout(r, 900));
      setSuccess(true);
      setTimeout(() => router.push("/"), 1100);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl shadow-slate-950/10 ring-1 ring-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden lg:block relative">
          <AnimatedBackground />
        </div>

        <div className="flex flex-col px-6 sm:px-10 py-10 sm:py-12">
          <div className="max-w-md w-full mx-auto">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase tracking-widest border border-cyan-100">
              Create account
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Join D2D Holidays
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Plan, save and book curated luxury trips in one place.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
                    <span>{apiError}</span>
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
                    <span>Account created! Redirecting…</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="Full name"
                type="text"
                placeholder="Jane Doe"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                icon={<UserIcon className="w-4 h-4" />}
                disabled={loading}
              />

              <InputField
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
                disabled={loading}
              />

              <PasswordField
                label="Password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={loading}
              />

              <PasswordField
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={errors.confirm}
                disabled={loading}
              />

              <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="font-semibold text-cyan-700 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-semibold text-cyan-700 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:shadow-cyan-500/50 transition-all disabled:opacity-70 disabled:cursor-wait"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Creating your account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-sm text-slate-500 pt-2">
                Already have an account?{" "}
                <Link
                  href="/"
                  className="font-bold text-cyan-700 hover:text-cyan-900 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
