"use client";

import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import Logo from "@/components/common/Logo";

const support = [
  { label: "Contact Us", href: "/contact-us" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Cancellation Policy", href: "/cancellation-policy" },
];

const socials = [
  {
    Icon: Facebook,
    href: "https://www.facebook.com/share/1D3CRKHgH2/",
    label: "Facebook",
  },
  {
    Icon: Instagram,
    href: "https://www.instagram.com/drive.to.destination?igsh=aWZrd2IxeGdyNjNi",
    label: "Instagram",
  },
  {
    Icon: Linkedin,
    href: "https://www.linkedin.com/company/drive-to-destination-holidays/",
    label: "LinkedIn",
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-300 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.18),transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#home" className="inline-flex items-center">
              <Logo size="md" tone="light" />
            </a>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Every destination has a story waiting to be discovered. We
              turn your travel dreams into unforgettable experiences with
              personalized itineraries and seamless journeys. Every trip is
              thoughtfully crafted with care, so wherever your heart
              leads, we&apos;ll take you there.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-cyan-500 border border-white/10 hover:border-cyan-500 text-slate-300 hover:text-white transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              {support.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("/") ? (
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Get in touch
            </h4>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">
                  C86, Sterling Bispark, Fort Station Road, Thillai Nagar, Trichy 620018
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">
                  <a
                    href="tel:+919500121263"
                    className="hover:text-cyan-300 transition-colors"
                  >
                    +91 95001 21263
                  </a>
                  {", "}
                  <a
                    href="tel:+919500121261"
                    className="hover:text-cyan-300 transition-colors"
                  >
                    +91 95001 21261
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <a
                  href="mailto:d2dholidays.admin@gmail.com"
                  className="text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  d2dholidays.admin@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} D2D Holidays. All rights reserved.
          </p>
          <p>
            Crafted with <span className="text-cyan-400">&hearts;</span> for explorers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
