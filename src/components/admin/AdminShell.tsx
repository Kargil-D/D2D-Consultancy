"use client";

import Link from "next/link";
import Logo from "@/components/common/Logo";
import { ToastProvider } from "@/components/admin/ui/Toast";

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminShell({ children, title }: AdminShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100">
        <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="sm" tone="light" showWordmark={false} />
              <div className="text-sm font-semibold tracking-wide">
                Admin / Backend{title ? ` — ${title}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xs font-medium text-white/70 hover:text-white"
              >
                View site ?
              </Link>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto">
          <main className="bg-slate-100 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
