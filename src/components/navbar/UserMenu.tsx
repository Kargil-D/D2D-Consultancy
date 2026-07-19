"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Compass, MapPin, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const MENU_LINKS = [
  { href: "/account/vacations", label: "Your Vacations", icon: Compass },
  { href: "/account/activities", label: "Your Activities", icon: MapPin },
  { href: "/account/profile", label: "Your Account", icon: UserRound },
];

interface UserMenuProps {
  scrolled: boolean;
}

export default function UserMenu({ scrolled }: UserMenuProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 text-sm font-medium transition-colors ${
          scrolled
            ? "text-slate-700 hover:bg-slate-100"
            : "text-white/90 hover:bg-white/10"
        }`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="max-w-[120px] truncate">{user.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg shadow-slate-900/10">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          {MENU_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
