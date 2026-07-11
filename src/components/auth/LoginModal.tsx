"use client";

import { X } from "lucide-react";
import ModalWrapper from "./ModalWrapper";
import AnimatedBackground from "./AnimatedBackground";
import LoginForm from "./LoginForm";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onRegister?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginModal({
  open,
  onClose,
  onRegister,
  onForgotPassword,
}: LoginModalProps) {
  return (
    <ModalWrapper open={open} onClose={onClose} labelledBy="login-modal-title">
      <div className="relative w-screen h-[100dvh] sm:w-auto sm:h-auto sm:rounded-3xl overflow-hidden bg-white shadow-2xl shadow-slate-950/40 ring-1 ring-white/40">
        {/* Gradient border halo (desktop) */}
        <div
          aria-hidden
          className="hidden sm:block absolute -inset-px rounded-3xl bg-gradient-to-br from-cyan-300/50 via-blue-300/40 to-orange-300/40 pointer-events-none"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] min-h-[100dvh] sm:min-h-0 sm:h-[640px] sm:w-[920px] max-w-full">
          {/* Left visual panel — hidden on mobile */}
          <div className="hidden lg:block relative">
            <AnimatedBackground />
          </div>

          {/* Right form panel */}
          <div className="relative flex flex-col bg-white">
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              aria-label="Close login dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-10 sm:py-12">
              <div className="max-w-md mx-auto w-full">
                <div className="mb-7">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase tracking-widest border border-cyan-100">
                    Member access
                  </span>
                  <h1
                    id="login-modal-title"
                    className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
                  >
                    Welcome back ??
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-500">
                    Sign in to access your saved trips, quotes and bookings.
                  </p>
                </div>

                <LoginForm
                  onSuccess={onClose}
                  onForgotPassword={onForgotPassword}
                  onRegister={onRegister}
                />
              </div>
            </div>

            {/* Mobile-only mini brand footer */}
            <div className="lg:hidden border-t border-slate-100 px-6 py-3 text-center text-[11px] uppercase tracking-widest text-slate-400">
              D2D Holidays — Drive to Destination
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
