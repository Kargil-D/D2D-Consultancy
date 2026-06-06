"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import InputField from "./InputField";
import PasswordField from "./PasswordField";
import { useAuth } from "@/contexts/AuthContext";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 4) errors.password = "Password is too short.";
  return errors;
}

export default function LoginForm({
  onSuccess,
  onForgotPassword,
  onRegister,
}: LoginFormProps) {
  const { login, loading, error, clearError, rememberedEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, [rememberedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await login({ email, password, rememberMe: remember });
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 700);
    } catch {
      // error already in context
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* API error banner */}
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
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Welcome back! Redirectingâ€¦</span>
          </motion.div>
        )}
      </AnimatePresence>

      <InputField
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        icon={<Mail className="w-4 h-4" />}
        disabled={loading}
      />

      <PasswordField
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        disabled={loading}
      />

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          Forgot password?
        </button>
      </div>

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
            Signing you inâ€¦
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </motion.button>

      {/* Register CTA */}
      <p className="text-center text-sm text-slate-500 pt-4">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => {
            if (onRegister) onRegister();
            else router.push("/register");
          }}
          className="font-bold text-cyan-700 hover:text-cyan-900 hover:underline"
        >
          Create one
        </button>
      </p>
    </form>
  );
}
