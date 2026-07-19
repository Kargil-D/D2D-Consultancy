"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, Compass, UserRound } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { href: "/account/vacations", label: "Your Vacations", icon: Compass },
  { href: "/account/activities", label: "Your Activities", icon: MapPin },
  { href: "/account/profile", label: "Your Account", icon: UserRound },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (loading || !isAuthenticated) {
    return (
      <main className="relative min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 pb-20 text-center text-sm text-slate-500">Loading…</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-50">
      <Navbar />

      <div className="pt-28 sm:pt-32 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-8">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-cyan-500 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>

      <Footer />
    </main>
  );
}
