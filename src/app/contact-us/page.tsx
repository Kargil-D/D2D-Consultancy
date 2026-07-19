"use client";

import { MapPin, Phone, Mail, MessageCircle, Clock, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

const ADDRESS =
  "4th Floor, Sterling Bispark, C86, Fort Station Rd, Thillai Nagar, Tennur, Tiruchirappalli, Tamil Nadu 620018";
const MAP_QUERY = `Drive To Destination Holidays, ${ADDRESS}`;
const PHONE_PRIMARY = "+91 95001 21263";
const PHONE_SECONDARY = "+91 95001 21261";
const EMAIL = "d2dholidays.admin@gmail.com";

const CONTACT_CARDS = [
  {
    icon: MapPin,
    label: "Visit Us",
    lines: [ADDRESS],
    action: {
      label: "Get Directions",
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`,
      external: true,
    },
  },
  {
    icon: Phone,
    label: "Call Us",
    lines: [PHONE_PRIMARY, PHONE_SECONDARY],
    action: {
      label: "Call Now",
      href: `tel:${PHONE_PRIMARY.replace(/\s/g, "")}`,
      external: false,
    },
  },
  {
    icon: Mail,
    label: "Email Us",
    lines: [EMAIL],
    action: {
      label: "Send an Email",
      href: `mailto:${EMAIL}`,
      external: false,
    },
  },
];

export default function ContactUsPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.28),transparent_60%)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm font-medium">
            <MessageCircle className="w-4 h-4 text-cyan-300" />
            We&apos;d love to hear from you
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            Get in{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>

          <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Have a question about a trip, a booking, or just want to say hello?
            Our team at D2D Holidays is ready to help you plan your next journey.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="relative bg-slate-50 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONTACT_CARDS.map(({ icon: Icon, label, lines, action }) => (
              <div
                key={label}
                className="group rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                  <Icon className="w-6 h-6" />
                </span>
                <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {label}
                </h3>
                <div className="mt-2 space-y-1">
                  {lines.map((line) => (
                    <p key={line} className="text-slate-900 font-medium leading-snug">
                      {line}
                    </p>
                  ))}
                </div>
                <a
                  href={action.href}
                  target={action.external ? "_blank" : undefined}
                  rel={action.external ? "noopener noreferrer" : undefined}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 group-hover:text-cyan-700"
                >
                  {action.label}
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            ))}
          </div>

          {/* Hours + WhatsApp CTA */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm shadow-slate-900/5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Clock className="w-6 h-6" />
              </span>
              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Working Hours
              </h3>
              <div className="mt-2 space-y-1 text-slate-900 font-medium">
                <p>Monday &ndash; Saturday: 9:30 AM &ndash; 7:00 PM</p>
                <p>Sunday: By appointment</p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.22),transparent_60%)]" />
              <div className="relative">
                <h3 className="text-white text-lg sm:text-xl font-bold">
                  Prefer to chat instantly?
                </h3>
                <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl">
                  Message us on WhatsApp and our travel experts will respond in
                  minutes.
                </p>
                <a
                  href={`https://wa.me/${PHONE_PRIMARY.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors w-fit"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
