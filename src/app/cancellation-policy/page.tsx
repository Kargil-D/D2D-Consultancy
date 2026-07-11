"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  Send,
  Percent,
  Handshake,
  FileEdit,
  Wallet,
  UserX,
  CloudLightning,
  RotateCcw,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

interface Tier {
  window: string;
  charge: string;
  percent: number;
}

interface Section {
  id: string;
  icon: LucideIcon;
  title: string;
  intro?: string;
  points?: string[];
  paragraphs?: string[];
  tiers?: Tier[];
}

const TIERS: Tier[] = [
  { window: "More than 30 days before departure", charge: "5%", percent: 5 },
  { window: "15–30 days before departure", charge: "50%", percent: 50 },
  { window: "7–14 days before departure", charge: "75%", percent: 75 },
  {
    window:
      "Less than 7 days before departure, No Show, or after commencement of travel",
    charge: "100%",
    percent: 100,
  },
];

const SECTIONS: Section[] = [
  {
    id: "cancellation-requests",
    icon: Send,
    title: "1. Cancellation Requests",
    points: [
      "All cancellation requests must be submitted in writing via our official email address or WhatsApp support.",
      "A cancellation request will be considered effective only after it has been acknowledged by D2D Holidays.",
      "Cancellation charges are calculated based on the date the written cancellation request is received.",
    ],
  },
  {
    id: "cancellation-charges",
    icon: Percent,
    title: "2. Cancellation Charges",
    intro:
      "Unless otherwise specified in your booking confirmation or by the respective service provider, the following cancellation charges shall apply:",
    tiers: TIERS,
  },
  {
    id: "supplier-cancellation-policies",
    icon: Handshake,
    title: "3. Supplier Cancellation Policies",
    paragraphs: [
      "Flights, hotels, cruises, trains, visas, travel insurance, and other third-party services are subject to the cancellation policies of the respective suppliers. Supplier cancellation charges shall apply in addition to any applicable service or processing fees charged by D2D Holidays.",
    ],
  },
  {
    id: "booking-modifications",
    icon: FileEdit,
    title: "4. Booking Modifications",
    paragraphs: [
      "Requests to modify travel dates, passenger details, destinations, or other booking information are subject to availability and approval by the respective service providers. Additional charges may apply for any changes requested after booking confirmation.",
    ],
  },
  {
    id: "non-refundable-services",
    icon: Wallet,
    title: "5. Non-Refundable Services",
    intro: "The following charges are generally non-refundable unless otherwise stated:",
    points: [
      "Service and consultation fees",
      "Visa processing charges",
      "Travel insurance premiums",
      "Payment gateway or convenience fees",
      "Government taxes and statutory fees (where applicable)",
      "Any supplier-designated non-refundable bookings",
    ],
  },
  {
    id: "no-show",
    icon: UserX,
    title: "6. No Show",
    paragraphs: [
      "Failure to arrive for a scheduled departure, hotel check-in, sightseeing activity, or any booked service without prior notice shall be treated as a No Show. In such cases, no refund shall be applicable unless permitted by the respective service provider.",
    ],
  },
  {
    id: "force-majeure",
    icon: CloudLightning,
    title: "7. Force Majeure",
    paragraphs: [
      "D2D Holidays shall not be responsible for cancellations, delays, or disruptions caused by events beyond its reasonable control, including but not limited to natural disasters, adverse weather conditions, pandemics, government restrictions, political unrest, strikes, or other unforeseen circumstances. Refunds, if any, shall be subject to the policies of the respective service providers.",
    ],
  },
  {
    id: "refunds-after-cancellation",
    icon: RotateCcw,
    title: "8. Refunds After Cancellation",
    paragraphs: [
      "Where applicable, refunds shall be processed in accordance with our Refund Policy after receiving the refunded amount from the respective suppliers. Refund processing timelines may vary depending on airlines, hotels, banks, payment gateways, and other service providers.",
    ],
  },
  {
    id: "contact-us",
    icon: Mail,
    title: "9. Contact Us",
    paragraphs: [
      "For cancellation requests or assistance, please contact us through our official email address, phone number, or WhatsApp support available on our website.",
    ],
  },
];

function tierTone(percent: number): { text: string; bg: string; bar: string } {
  if (percent <= 5) return { text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", bar: "bg-emerald-500" };
  if (percent <= 50) return { text: "text-amber-700", bg: "bg-amber-50 border-amber-200", bar: "bg-amber-500" };
  if (percent <= 75) return { text: "text-orange-700", bg: "bg-orange-50 border-orange-200", bar: "bg-orange-500" };
  return { text: "text-rose-700", bg: "bg-rose-50 border-rose-200", bar: "bg-rose-500" };
}

export default function CancellationPolicyPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );

    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
            <Ban className="w-4 h-4 text-cyan-300" />
            Plans change &mdash; here&apos;s how we handle it
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            Cancellation{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>

          <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            We understand that travel plans may change unexpectedly. This
            policy outlines the terms applicable to cancellations,
            modifications, and related charges for our travel services.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs sm:text-sm font-medium">
            Effective Date: 1 July 2026
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative bg-slate-50 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 lg:gap-16">
            {/* TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  On this page
                </p>
                <nav className="space-y-1 border-l border-slate-200">
                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const active = activeId === s.id;
                    return (
                      <a
                        key={s.id}
                        href={`#${s.id}`}
                        className={`group flex items-center gap-2.5 -ml-px pl-4 py-2 border-l-2 text-sm transition-colors ${
                          active
                            ? "border-cyan-500 text-cyan-700 font-semibold"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            active ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-500"
                          }`}
                        />
                        <span className="truncate">{s.title.replace(/^\d+\.\s*/, "")}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Sections */}
            <div className="space-y-6">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <article
                    key={s.id}
                    id={s.id}
                    ref={(el) => {
                      sectionRefs.current[s.id] = el;
                    }}
                    className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm shadow-slate-900/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                        <Icon className="w-5 h-5" />
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        {s.title}
                      </h2>
                    </div>

                    <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                      {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}

                      {s.intro && <p>{s.intro}</p>}

                      {s.points && (
                        <ul className="space-y-2">
                          {s.points.map((point) => (
                            <li key={point} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 mt-2 rounded-full bg-cyan-400 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {s.tiers && (
                        <div className="mt-2 space-y-3">
                          {s.tiers.map((tier) => {
                            const tone = tierTone(tier.percent);
                            return (
                              <div
                                key={tier.window}
                                className={`rounded-2xl border p-4 sm:p-5 ${tone.bg}`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <p className="text-sm sm:text-[15px] font-medium text-slate-800">
                                    {tier.window}
                                  </p>
                                  <span
                                    className={`flex-shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold ${tone.text}`}
                                  >
                                    {tier.charge}
                                  </span>
                                </div>
                                <div className="mt-3 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${tone.bar}`}
                                    style={{ width: `${tier.percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}

              {/* Contact CTA */}
              <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.22),transparent_60%)]" />
                <div className="relative">
                  <h3 className="text-white text-lg sm:text-xl font-bold">
                    Need to cancel or modify a booking?
                  </h3>
                  <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
                    Reach out and our team will guide you through the process.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href="mailto:d2dholidays.admin@gmail.com"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email Us
                    </a>
                    <a
                      href="tel:+919500121263"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call Us
                    </a>
                    <a
                      href="https://wa.me/919500121263"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
