"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ScrollText,
  Plane,
  UserCheck,
  CheckCircle2,
  CreditCard,
  ClipboardList,
  RotateCcw,
  Handshake,
  ShieldAlert,
  Copyright,
  Ban,
  Lock,
  FileEdit,
  Scale,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

interface Section {
  id: string;
  icon: LucideIcon;
  title: string;
  intro?: string;
  points?: string[];
  paragraphs?: string[];
}

const SECTIONS: Section[] = [
  {
    id: "our-services",
    icon: Plane,
    title: "1. Our Services",
    paragraphs: [
      "D2D Holidays provides travel-related services, including domestic and international tour packages, hotel reservations, flight bookings, transportation arrangements, visa assistance, travel insurance, and other travel solutions. All services are subject to availability and confirmation by the respective service providers.",
    ],
  },
  {
    id: "eligibility",
    icon: UserCheck,
    title: "2. Eligibility",
    paragraphs: [
      "By using our services, you confirm that you are at least 18 years of age or are using the website under the supervision of a parent or legal guardian. You agree to provide accurate and complete information when making enquiries or bookings.",
    ],
  },
  {
    id: "booking-confirmation",
    icon: CheckCircle2,
    title: "3. Booking Confirmation",
    paragraphs: [
      "A booking is considered confirmed only after the required payment has been received and a written confirmation has been issued by D2D Holidays. Prices and availability are subject to change until the booking is confirmed.",
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "4. Payments",
    paragraphs: [
      "Customers agree to make payments according to the payment schedule communicated during the booking process. Failure to make payments on time may result in cancellation of the booking. Applicable taxes, service charges, and payment gateway fees may apply.",
    ],
  },
  {
    id: "customer-responsibilities",
    icon: ClipboardList,
    title: "5. Customer Responsibilities",
    intro: "Customers are responsible for:",
    points: [
      "Providing accurate personal and travel information.",
      "Ensuring passport, visa, permits, vaccinations, and other travel documents are valid and up to date.",
      "Arriving at airports, stations, and departure points on time.",
      "Complying with the rules and regulations of airlines, hotels, transport providers, and local authorities.",
    ],
  },
  {
    id: "changes-and-cancellations",
    icon: RotateCcw,
    title: "6. Changes and Cancellations",
    paragraphs: [
      "Any request to modify or cancel a booking is subject to availability and the cancellation policies of the respective service providers. Additional charges may apply. Refunds, where applicable, will be processed in accordance with our Refund Policy.",
    ],
  },
  {
    id: "third-party-services",
    icon: Handshake,
    title: "7. Third-Party Services",
    paragraphs: [
      "D2D Holidays acts as a travel facilitator and coordinates services provided by airlines, hotels, transport operators, cruise companies, visa agencies, and other third-party suppliers. These suppliers operate under their own terms and conditions, and D2D Holidays shall not be responsible for their actions, delays, cancellations, or service deficiencies.",
    ],
  },
  {
    id: "limitation-of-liability",
    icon: ShieldAlert,
    title: "8. Limitation of Liability",
    paragraphs: [
      "D2D Holidays shall not be liable for any loss, injury, accident, delay, cancellation, baggage loss, travel disruption, natural disasters, pandemics, political unrest, strikes, government actions, or any other event beyond our reasonable control. Any additional expenses arising from such circumstances shall be the responsibility of the customer.",
    ],
  },
  {
    id: "intellectual-property",
    icon: Copyright,
    title: "9. Intellectual Property",
    paragraphs: [
      "All content on this website, including text, logos, graphics, images, designs, and other materials, is the property of D2D Holidays unless otherwise stated. No content may be copied, reproduced, modified, or distributed without prior written permission.",
    ],
  },
  {
    id: "acceptable-use",
    icon: Ban,
    title: "10. Acceptable Use",
    intro: "You agree not to:",
    points: [
      "Use the website for unlawful or fraudulent purposes.",
      "Attempt unauthorized access to our systems or data.",
      "Upload or transmit harmful software or malicious code.",
      "Interfere with the operation or security of the website.",
    ],
  },
  {
    id: "privacy",
    icon: Lock,
    title: "11. Privacy",
    paragraphs: [
      "Your use of our services is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal information.",
    ],
  },
  {
    id: "changes-to-the-terms",
    icon: FileEdit,
    title: "12. Changes to the Terms",
    paragraphs: [
      "We reserve the right to modify these Terms of Service at any time. Updated terms will be published on this page with a revised Effective Date. Continued use of our website or services after such changes constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "governing-law",
    icon: Scale,
    title: "13. Governing Law",
    paragraphs: [
      "These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent courts in Tiruchirappalli, Tamil Nadu.",
    ],
  },
  {
    id: "contact-us",
    icon: Mail,
    title: "14. Contact Us",
    paragraphs: [
      "If you have any questions regarding these Terms of Service, please contact us through our official email address, phone number, or WhatsApp support available on our website.",
    ],
  },
];

export default function TermsOfServicePage() {
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
            <ScrollText className="w-4 h-4 text-cyan-300" />
            The fine print, made simple
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            Terms of{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Conditions
            </span>
          </h1>

          <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Welcome to D2D Holidays &ndash; Drive to Destination. By accessing our
            website or using our services, you agree to be bound by these
            Terms of Service.
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
                    </div>
                  </article>
                );
              })}

              {/* Contact CTA */}
              <div className="rounded-3xl bg-slate-950 p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.22),transparent_60%)]" />
                <div className="relative">
                  <h3 className="text-white text-lg sm:text-xl font-bold">
                    Questions about these terms?
                  </h3>
                  <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
                    Reach out and our team will get back to you promptly.
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
