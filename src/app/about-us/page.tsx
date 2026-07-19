"use client";

import {
  Sparkles,
  Target,
  Eye,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Lightbulb,
  Award,
  BadgeCheck,
  Compass,
} from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

const WHY_CHOOSE_US = [
  "Pan-India Travel Technology & Innovation Company",
  "Domestic, Outbound & Inbound Tour Specialists",
  "Customized Holiday Packages",
  "Personalized Travel Planning",
  "Flight, Hotel, Visa & Travel Insurance Assistance",
  "Corporate Travel, MICE & Group Tour Solutions",
  "Honeymoon, Family & Luxury Holiday Specialists",
  "Competitive & Transparent Pricing",
  "Trusted Global Travel Partners & DMC Network",
  "Complete End-to-End Travel Services & Support",
  "Dedicated Travel Consultants",
  "Secure & Hassle-Free Booking Experience",
  "24/7 Travel Assistance",
  "Technology Powered with a Human Touch",
];

const CORE_VALUES = [
  { label: "Customer First", icon: Heart },
  { label: "Trust & Transparency", icon: ShieldCheck },
  { label: "Innovation", icon: Lightbulb },
  { label: "Quality & Excellence", icon: Award },
  { label: "Integrity & Reliability", icon: BadgeCheck },
  { label: "Passion for Travel", icon: Compass },
];

export default function AboutUsPage() {
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
            <Sparkles className="w-4 h-4 text-cyan-300" />
            Your Journey, Our Passion
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
            About{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Us
            </span>
          </h1>

          <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Drive To Destination Holidays (D2D Holidays) is a Pan-India travel
            technology and innovation company dedicated to creating memorable
            travel experiences for customers across India and around the world.
          </p>
        </div>
      </section>

      {/* Intro prose */}
      <section className="relative bg-slate-50 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm shadow-slate-900/5 space-y-5 text-slate-600 leading-relaxed">
            <p>
              By combining modern technology with personalized travel expertise, we
              simplify the way people discover, plan, and enjoy their journeys.
            </p>
            <p>
              From weekend getaways to international vacations, we provide
              end-to-end travel solutions through Domestic Tours, Outbound
              International Holidays, and Inbound Tours. Our services include
              customized holiday packages, honeymoon vacations, family holidays,
              luxury travel, corporate travel, MICE, student educational tours,
              hotel reservations, flight ticket bookings, visa assistance, travel
              insurance, airport transfers, transportation, sightseeing tours,
              cruise holidays, and complete travel management&mdash;all under one
              roof.
            </p>
            <p>
              At Drive To Destination Holidays, people always come before
              technology. While we leverage travel technology and innovation to
              simplify planning and bookings, our greatest strength is the
              personal care and human touch we bring to every journey. We believe
              technology should make travel easier&mdash;not replace genuine
              relationships. Every customer is supported by dedicated travel
              experts who understand their unique needs and provide personalized
              guidance throughout the journey.
            </p>
            <p>
              Whether you prefer planning your trip online or speaking directly
              with one of our travel consultants, we provide complete end-to-end
              travel services and support from your first enquiry until your safe
              return home. From destination planning and customized itineraries to
              bookings, documentation, visa assistance, travel updates, on-trip
              support, and post-travel assistance, we&apos;re with you every step
              of the way.
            </p>
            <p>
              We understand that every traveler is different. Some enjoy the
              convenience of digital platforms, while others prefer the
              reassurance of speaking with a real person. Our services are
              designed to be simple, accessible, and reliable for everyone,
              regardless of age, location, or familiarity with technology.
              Whether you&apos;re travelling from a metro city, a growing town, or
              a rural community, we ensure that every customer receives the same
              level of care, attention, and personalized service.
            </p>
            <p>
              For international visitors, our Inbound Tour services showcase the
              incredible diversity of India through carefully curated itineraries
              covering cultural heritage, spiritual destinations, wildlife,
              beaches, hill stations, luxury experiences, festivals, wellness
              retreats, and authentic local traditions&mdash;delivering an
              unforgettable experience of India&apos;s rich culture and
              hospitality.
            </p>
            <p>
              Driven by customer satisfaction, innovation, and trusted global
              partnerships, we continue to build smarter travel solutions while
              preserving the human touch that makes every journey effortless,
              reliable, and memorable. At Drive To Destination Holidays,
              technology powers the experience&mdash;but people make the journey
              memorable.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative bg-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Target className="w-6 h-6" />
              </span>
              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Our Mission
              </h3>
              <p className="mt-2 text-slate-900 font-medium leading-relaxed">
                To provide reliable, affordable, and personalized travel
                solutions through technology, innovation, and exceptional
                customer service while delivering complete end-to-end support
                and unforgettable travel experiences.
              </p>
            </div>

            <div className="group rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                <Eye className="w-6 h-6" />
              </span>
              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Our Vision
              </h3>
              <p className="mt-2 text-slate-900 font-medium leading-relaxed">
                To become one of India&apos;s most trusted travel brands by
                connecting people with incredible destinations through quality
                service, innovation, and care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="relative bg-slate-50 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why Choose Drive To Destination Holidays?
            </h2>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm shadow-slate-900/5">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {WHY_CHOOSE_US.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="relative bg-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {CORE_VALUES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="group rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                  <Icon className="w-5 h-5" />
                </span>
                <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing statement */}
      <section className="relative bg-slate-50 pb-14 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-slate-950 p-8 sm:p-12 relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.22),transparent_60%)]" />
            <div className="relative">
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                Drive To Destination Holidays (D2D Holidays) is more than a travel
                company&mdash;we are your trusted travel partner, committed to
                making travel simple, accessible, and memorable for everyone
                through innovation, personalized service, and genuine human care.
              </p>
              <p className="mt-5 text-xl sm:text-2xl font-bold text-white">
                Drive To Destination Holidays &ndash; Your Journey, Our Passion.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
