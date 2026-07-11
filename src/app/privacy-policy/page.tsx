"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  ClipboardList,
  Workflow,
  Share2,
  Lock,
  Cookie,
  ExternalLink,
  Archive,
  UserCheck,
  Baby,
  RefreshCw,
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
  footnote?: string;
}

const SECTIONS: Section[] = [
  {
    id: "information-we-collect",
    icon: ClipboardList,
    title: "1. Information We Collect",
    intro: "We may collect the following information:",
    points: [
      "Full name",
      "Email address",
      "Mobile number",
      "Postal address",
      "Date of birth (where required)",
      "Passport, visa, or identification details (when required for travel bookings)",
      "Payment and billing information",
      "Travel preferences and booking details",
      "Any other information voluntarily provided through enquiry or booking forms",
    ],
  },
  {
    id: "how-we-use-your-information",
    icon: Workflow,
    title: "2. How We Use Your Information",
    intro: "Your information may be used to:",
    points: [
      "Process and manage travel bookings",
      "Communicate booking confirmations, updates, and travel information",
      "Arrange services with airlines, hotels, transport providers, visa agencies, and other travel partners",
      "Respond to enquiries and provide customer support",
      "Process payments and refunds",
      "Improve our website, products, and customer experience",
      "Comply with applicable legal and regulatory requirements",
    ],
  },
  {
    id: "information-sharing",
    icon: Share2,
    title: "3. Information Sharing",
    paragraphs: ["We do not sell, rent, or trade your personal information."],
    intro: "Your information may be shared only with:",
    points: [
      "Airlines",
      "Hotels and accommodation providers",
      "Transport operators",
      "Visa processing agencies",
      "Payment gateway providers",
      "Government or regulatory authorities where legally required",
      "Trusted service providers assisting us in delivering our services",
    ],
    footnote:
      "All third parties receive only the information necessary to perform their respective services.",
  },
  {
    id: "data-security",
    icon: Lock,
    title: "4. Data Security",
    paragraphs: [
      "We implement reasonable administrative, technical, and organizational measures to safeguard your personal information against unauthorized access, alteration, disclosure, or misuse. While we strive to protect your data, no method of electronic transmission or storage can be guaranteed to be completely secure.",
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    title: "5. Cookies",
    paragraphs: [
      "Our website may use cookies and similar technologies to improve website functionality, enhance your browsing experience, analyze website traffic, and remember your preferences.",
      "You may disable cookies through your browser settings; however, certain website features may not function properly.",
    ],
  },
  {
    id: "third-party-links",
    icon: ExternalLink,
    title: "6. Third-Party Links",
    paragraphs: [
      "Our website may contain links to third-party websites. We are not responsible for the privacy practices, content, or security of those external websites. Users are encouraged to review the privacy policies of any third-party sites they visit.",
    ],
  },
  {
    id: "data-retention",
    icon: Archive,
    title: "7. Data Retention",
    paragraphs: [
      "We retain personal information only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and maintain business records.",
    ],
  },
  {
    id: "your-rights",
    icon: UserCheck,
    title: "8. Your Rights",
    intro: "Subject to applicable laws, you may request to:",
    points: [
      "Access your personal information",
      "Correct inaccurate or incomplete information",
      "Request deletion of your personal data where legally permissible",
      "Withdraw consent for marketing communications at any time",
    ],
    footnote:
      "To exercise these rights, please contact us using the details provided below.",
  },
  {
    id: "childrens-privacy",
    icon: Baby,
    title: "9. Children's Privacy",
    paragraphs: [
      "Our services are not intended for children under the age of 18 without the consent or supervision of a parent or legal guardian. We do not knowingly collect personal information directly from children.",
    ],
  },
  {
    id: "changes-to-this-policy",
    icon: RefreshCw,
    title: "10. Changes to This Privacy Policy",
    paragraphs: [
      "We reserve the right to update or modify this Privacy Policy at any time. Any changes will be published on this page with an updated Effective Date. Continued use of our website or services constitutes acceptance of the revised policy.",
    ],
  },
  {
    id: "contact-us",
    icon: Mail,
    title: "11. Contact Us",
    paragraphs: [
      "If you have any questions regarding this Privacy Policy or the handling of your personal information, please contact us through our official email address, phone number, or WhatsApp support available on our website.",
    ],
  },
];

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-4 h-4 text-cyan-300" />
            Your data, handled with care
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            Privacy{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>

          <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            At D2D Holidays &ndash; Drive to Destination, we value your privacy
            and are committed to protecting your personal information. Here&apos;s
            exactly how we collect, use, store, and protect it.
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

                      {s.footnote && (
                        <p className="text-slate-500 italic">{s.footnote}</p>
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
                    Questions about your privacy?
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
