"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import Logo from "@/components/common/Logo";
import { ToastProvider } from "@/components/admin/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminShell({ children, title }: AdminShellProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

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
                className="inline-flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white"
              >
                View site
                <ExternalLink className="w-3 h-3" />
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold"
                  aria-label="Account menu"
                >
                  {initial}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white text-slate-900 shadow-xl border border-slate-200 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="text-sm font-semibold truncate">{user?.name ?? "—"}</div>
                        <div className="text-xs text-slate-500 truncate">{user?.email ?? "—"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </>
                )}
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
