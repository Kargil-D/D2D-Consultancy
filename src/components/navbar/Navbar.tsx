"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, Sparkles } from "lucide-react";
import Button from "@/components/common/Button";
import Logo from "@/components/common/Logo";
import LoginModal from "@/components/auth/LoginModal";
import { NAV_LINKS } from "@/data/navigation";
import DestinationsMegaMenu, {
  DestinationsMegaMenuMobile,
} from "@/components/navbar/DestinationsMegaMenu";
import PackagesMegaMenu, {
  PackagesMegaMenuMobile,
} from "@/components/navbar/PackagesMegaMenu";

/**
 * Sticky transparent navbar that turns into a frosted glass bar on scroll.
 * Includes a responsive hamburger menu for mobile devices and premium
 * "Destinations" + "Packages" mega-menus on desktop.
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Generic hover helper: opens immediately, closes with a small grace
  // window so moving the cursor from trigger -> popover does not snap shut.
  const useHover = () => {
    const [isOpen, setIsOpen] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const openIt = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      setIsOpen(true);
    };
    const closeIt = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setIsOpen(false), 140);
    };
    return { isOpen, setIsOpen, openIt, closeIt };
  };

  const destinations = useHover();
  const packages = useHover();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        destinations.setIsOpen(false);
        packages.setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [destinations, packages]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-xl shadow-md" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        {/* Logo - always returns to the landing page hero */}
        <Link
          href="/#home"
          className="flex items-center group"
          aria-label="D2D Holidays - back to home"
        >
          <Logo size="md" tone={scrolled ? "dark" : "light"} />
        </Link>

        {/* Desktop menu */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const label = link.label.toLowerCase();

            if (label === "destinations") {
              return (
                <li key={link.href}>
                  <DestinationsMegaMenu
                    open={destinations.isOpen}
                    scrolled={scrolled}
                    onMouseEnter={destinations.openIt}
                    onMouseLeave={destinations.closeIt}
                    onFocus={destinations.openIt}
                    onBlur={destinations.closeIt}
                  />
                </li>
              );
            }

            if (label === "campaigns") {
              return (
                <li key={link.href}>
                  <PackagesMegaMenu
                    open={packages.isOpen}
                    scrolled={scrolled}
                    onMouseEnter={packages.openIt}
                    onMouseLeave={packages.closeIt}
                    onFocus={packages.openIt}
                    onBlur={packages.closeIt}
                  />
                </li>
              );
            }

            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors group ${
                    scrolled
                      ? "text-slate-700 hover:text-cyan-600"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {link.label}
                  <span className="absolute left-4 right-4 -bottom-0.5 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                </a>
              </li>
            );
          })}
        </ul>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            variant={scrolled ? "outline" : "ghost"}
            size="sm"
            aria-label="Login"
            onClick={() => setLoginOpen(true)}
          >
            <LogIn className="w-4 h-4" />
            Login
          </Button>
          <Button variant="primary" size="sm">
            <Sparkles className="w-4 h-4" />
            Plan My Trip
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
            scrolled
              ? "text-slate-900 hover:bg-slate-100"
              : "text-white hover:bg-white/10"
          }`}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 overflow-hidden"
          >
            <ul className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link) => {
                const label = link.label.toLowerCase();
                if (label === "destinations") {
                  return (
                    <li key={link.href}>
                      <DestinationsMegaMenuMobile
                        onNavigate={() => setOpen(false)}
                      />
                    </li>
                  );
                }
                if (label === "campaigns") {
                  return (
                    <li key={link.href}>
                      <PackagesMegaMenuMobile
                        onNavigate={() => setOpen(false)}
                      />
                    </li>
                  );
                }
                return (
                  <li key={link.href}>
                    <a
                      onClick={() => setOpen(false)}
                      href={link.href}
                      className="block px-4 py-3 rounded-lg text-slate-700 font-medium hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
              <li className="pt-3 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    setLoginOpen(true);
                  }}
                >
                  <LogIn className="w-4 h-4" /> Login
                </Button>
                <Button variant="primary" size="sm">
                  <Sparkles className="w-4 h-4" /> Plan Trip
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  );
}
