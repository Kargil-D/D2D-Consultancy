import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";
import {
  DESTINATIONS,
  type DestinationInfo,
  type DestinationPackage,
} from "@/data/destinationPackages";
import Logo from "@/components/common/Logo";
import DestinationPackagesGrid from "@/components/packages/DestinationPackagesGrid";

/* -------------------------------------------------------------------------- */
/* Slug catalog                                                                */
/* -------------------------------------------------------------------------- */

interface ThemeCatalog {
  kind: "theme";
  slug: string;
  /** Title shown on the hero (e.g. "Honeymoon Packages"). */
  title: string;
  eyebrow: string;
  tagline: string;
  heroImage: string;
  /** Tag values from DestinationPackage.tag that belong to this theme. */
  matchTags: string[];
}

interface DestinationCatalog {
  kind: "destination";
  slug: string;
  destination: DestinationInfo;
}

type Catalog = ThemeCatalog | DestinationCatalog;

const THEME_CATALOGS: ThemeCatalog[] = [
  {
    kind: "theme",
    slug: "honeymoon",
    title: "Honeymoon Packages",
    eyebrow: "For two",
    tagline: "Romantic getaways crafted for couples",
    heroImage:
      "https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=2000",
    matchTags: ["Honeymoon"],
  },
  {
    kind: "theme",
    slug: "family",
    title: "Family Packages",
    eyebrow: "For everyone",
    tagline: "Trips your whole family will remember",
    heroImage:
      "https://images.pexels.com/photos/1574653/pexels-photo-1574653.jpeg?auto=compress&cs=tinysrgb&w=2000",
    matchTags: ["Family"],
  },
  {
    kind: "theme",
    slug: "luxury",
    title: "Luxury Packages",
    eyebrow: "Premium stays",
    tagline: "Five-star villas, private tours and curated luxury",
    heroImage:
      "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=2000",
    matchTags: ["Luxury"],
  },
  {
    kind: "theme",
    slug: "adventure",
    title: "Adventure Packages",
    eyebrow: "Thrill seekers",
    tagline: "Treks, dives and adrenaline-fueled escapes",
    heroImage:
      "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=2000",
    matchTags: ["Adventure"],
  },
  {
    kind: "theme",
    slug: "group",
    title: "Group Packages",
    eyebrow: "Travel together",
    tagline: "Curated trips for friends, colleagues and large groups",
    heroImage:
      "https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=2000",
    matchTags: ["Group", "Friends"],
  },
];

/** Slugs we explicitly want to expose as `/packages/<slug>` from the menu. */
const DESTINATION_PACKAGE_SLUGS = [
  "thailand",
  "vietnam",
  "bali",
  "switzerland",
  "maldives",
  "kerala",
];

const ALL_PACKAGE_SLUGS = [
  ...THEME_CATALOGS.map((t) => t.slug),
  ...DESTINATION_PACKAGE_SLUGS,
];

function getCatalog(slug: string): Catalog | undefined {
  const theme = THEME_CATALOGS.find((t) => t.slug === slug);
  if (theme) return theme;
  const dest = DESTINATIONS[slug];
  if (dest) return { kind: "destination", slug, destination: dest };
  return undefined;
}

/**
 * Aggregate packages across all curated destinations whose tag matches the
 * theme. Each returned package is tagged with its origin destination name so
 * we can group/label correctly on the page.
 */
function packagesForTheme(theme: ThemeCatalog): Array<
  DestinationPackage & { destinationName: string; destinationSlug: string }
> {
  const matchers = theme.matchTags.map((t) => t.toLowerCase());
  const out: Array<
    DestinationPackage & { destinationName: string; destinationSlug: string }
  > = [];
  for (const dest of Object.values(DESTINATIONS)) {
    for (const pkg of dest.packages) {
      if (pkg.tag && matchers.includes(pkg.tag.toLowerCase())) {
        out.push({
          ...pkg,
          destinationName: dest.name,
          destinationSlug: dest.slug,
        });
      }
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Next.js metadata + params                                                   */
/* -------------------------------------------------------------------------- */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_PACKAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = getCatalog(slug);
  if (!catalog) return { title: "Packages - D2D Holidays" };

  if (catalog.kind === "theme") {
    return {
      title: `${catalog.title} - D2D Holidays`,
      description: `${catalog.tagline}. Browse curated ${catalog.title.toLowerCase()} by D2D Holidays.`,
    };
  }
  const d = catalog.destination;
  return {
    title: `${d.name} Packages - D2D Holidays`,
    description: `${d.tagline}. Hand-picked ${d.name} packages by D2D Holidays.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default async function PackagesLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const catalog = getCatalog(slug);
  if (!catalog) notFound();

  const isTheme = catalog.kind === "theme";

  const title = isTheme ? catalog.title : `${catalog.destination.name} Packages`;
  const eyebrow = isTheme ? catalog.eyebrow : catalog.destination.country;
  const tagline = isTheme ? catalog.tagline : catalog.destination.tagline;
  const heroImage = isTheme ? catalog.heroImage : catalog.destination.heroImage;

  return (
    <main className="relative min-h-screen bg-slate-50">
      {/* Sticky top bar */}
      <header className="sticky top-0 inset-x-0 z-[60] bg-slate-900/70 backdrop-blur-xl border-b border-white/10">
        <div className="relative z-[60] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Back to home" className="inline-flex items-center">
            <Logo size="sm" tone="light" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[72vh] min-h-[480px] w-full -mt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src={heroImage}
            alt={title}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.25),transparent_60%)]" />
        </div>

        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14">
          <span className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white/95 text-xs font-semibold tracking-widest uppercase">
            <MapPin className="w-3.5 h-3.5" />
            {eyebrow}
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base sm:text-lg md:text-xl text-slate-200/95">
            {tagline}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a
              href="#packages"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-white bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/20 transition-all"
            >
              View Packages
            </a>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section
        id="packages"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20"
      >
        {isTheme ? (
          <ThemePackagesBlock theme={catalog} />
        ) : (
          <>
            <div className="max-w-5xl mx-auto mb-12">
              <div className="text-center">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold tracking-widest uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Your Journey Starts with D2D
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-sm shadow-slate-900/5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Loved by Travelers Worldwide
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Thousands of genuine reviews from happy explorers across
                      our curated journeys.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-sm shadow-slate-900/5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Real Travel Experts, Anytime
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Friendly travel consultants ready to craft and support
                      your trip around the clock.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DestinationPackagesGrid
              packages={catalog.destination.packages}
              destinationName={catalog.destination.name}
            />
          </>
        )}
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Theme block - aggregates packages across destinations and groups them      */
/* -------------------------------------------------------------------------- */

function ThemePackagesBlock({ theme }: { theme: ThemeCatalog }) {
  const all = packagesForTheme(theme);

  if (!all.length) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center text-slate-500 ring-1 ring-slate-100">
        We are curating new {theme.title.toLowerCase()} for you. Please check
        back soon.
      </div>
    );
  }

  // Group by destination so the page reads nicely.
  const groups = new Map<
    string,
    {
      destinationName: string;
      destinationSlug: string;
      items: DestinationPackage[];
    }
  >();
  for (const pkg of all) {
    const key = pkg.destinationSlug;
    const existing = groups.get(key);
    if (existing) existing.items.push(pkg);
    else
      groups.set(key, {
        destinationName: pkg.destinationName,
        destinationSlug: pkg.destinationSlug,
        items: [pkg],
      });
  }

  return (
    <div className="space-y-14">
      <div className="max-w-5xl mx-auto mb-2">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Your Journey Starts with D2D
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-sm shadow-slate-900/5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Loved by Travelers Worldwide
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Thousands of genuine reviews from happy explorers across our
                curated journeys.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-sm shadow-slate-900/5 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Real Travel Experts, Anytime
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Friendly travel consultants ready to craft and support your
                trip around the clock.
              </p>
            </div>
          </div>
        </div>
      </div>

      {Array.from(groups.values()).map((group) => (
        <div key={group.destinationSlug}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
                Destination
              </p>
              <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {group.destinationName}
              </h3>
            </div>
          </div>
          <DestinationPackagesGrid
            packages={group.items}
            destinationName={group.destinationName}
          />
        </div>
      ))}
    </div>
  );
}
