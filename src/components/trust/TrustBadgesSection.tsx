import {
  BadgeCheck,
  Sparkles,
  Headphones,
  ShieldCheck,
  Heart,
  type LucideIcon,
} from "lucide-react";

interface TrustBadge {
  icon: LucideIcon;
  title: string;
  /** Tailwind classes for the icon tile background + icon colour. */
  tone: string;
}

const BADGES: TrustBadge[] = [
  {
    icon: BadgeCheck,
    title: "Best Price\nGuarantee",
    tone: "bg-sky-100 text-sky-600",
  },
  {
    icon: Sparkles,
    title: "Handpicked\nExperiences",
    tone: "bg-violet-100 text-violet-600",
  },
  {
    icon: Headphones,
    title: "24/7 Travel\nSupport",
    tone: "bg-amber-100 text-amber-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure\nBooking",
    tone: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Heart,
    title: "Trusted by\n1000+ Travelers",
    tone: "bg-rose-100 text-rose-600",
  },
];

/**
 * Compact trust strip - icon tiles + two-line label. Sits between the
 * reviews section and the footer to reinforce buyer confidence right
 * before the user reaches the end of the page.
 */
export default function TrustBadgesSection() {
  return (
    <section
      id="trust-badges"
      className="relative bg-white pt-2 pb-10 md:pt-4 md:pb-14"
      aria-label="Why book with us"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-50/80 ring-1 ring-slate-100 px-4 py-8 md:px-10 md:py-10">
          <ul className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-3 md:grid-cols-5 md:gap-x-6">
            {BADGES.map(({ icon: Icon, title, tone }) => (
              <li
                key={title}
                className="flex flex-col items-center text-center"
              >
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white ${tone}`}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.2} />
                </span>
                <span className="mt-3 whitespace-pre-line text-sm font-semibold leading-snug text-slate-800">
                  {title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
