"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, UserCog, AlertCircle, CalendarDays } from "lucide-react";
import Logo from "@/components/common/Logo";
import { ToastProvider } from "@/components/admin/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { employeesApi } from "@/lib/adminApi";

interface AdminShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminShell({ children, title }: AdminShellProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resolvingProfile, setResolvingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const isAdmin = user?.roles.includes("admin") ?? false;
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  // Resolves *your own* linked Employee record (never a picker — always "me") and jumps
  // straight to its edit page, same page EmployeeForm disables self-editing on.
  const openProfileSettings = async () => {
    setProfileError(null);
    setResolvingProfile(true);
    try {
      const res = await employeesApi.me();
      if (res.success && res.data) {
        setMenuOpen(false);
        router.push(`/admin/employees/${res.data.id}/edit`);
      } else {
        setProfileError(res.message || "No employee profile is linked to your login account.");
      }
    } finally {
      setResolvingProfile(false);
    }
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
                target="_blank"
                rel="noreferrer"
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
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-slate-900 shadow-xl border border-slate-200 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="text-sm font-semibold truncate">{user?.name ?? "—"}</div>
                        <div className="text-xs text-slate-500 truncate">{user?.email ?? "—"}</div>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={openProfileSettings}
                          disabled={resolvingProfile}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <UserCog className="w-4 h-4" /> {resolvingProfile ? "Opening…" : "Profile Settings"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/admin/my-roster");
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <CalendarDays className="w-4 h-4" /> My Roster
                      </button>
                      {profileError && (
                        <div className="flex items-start gap-1.5 px-4 py-2 text-xs text-rose-600 bg-rose-50 border-t border-rose-100">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>{profileError}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 border-t border-slate-100"
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
