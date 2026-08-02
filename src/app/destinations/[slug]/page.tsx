import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { findDestinationByNameOrSlug } from "@/services/destinationService";
import { listCampaigns } from "@/services/campaignService";
import Logo from "@/components/common/Logo";
import DestinationPackagesGrid from "@/components/packages/DestinationPackagesGrid";
import type { DestinationPackage } from "@/data/destinationPackages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = await findDestinationByNameOrSlug(slug);
  if (!destination) return { title: "Destination - D2D Holidays" };
  return {
    title: destination.seoTitle || `${destination.name} Packages - D2D Holidays`,
    description: destination.seoDescription || destination.shortDescription || undefined,
  };
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const destination = await findDestinationByNameOrSlug(slug);
  if (!destination || destination.status !== "Active") notFound();

  const { items: campaigns } = await listCampaigns({
    pageSize: 50,
    filter: { destinationId: destination.id, status: "Active" },
  });

  const packages: DestinationPackage[] = campaigns.map((c) => ({
    id: c.id,
    title: c.name,
    duration: `${c.days}D / ${c.nights}N`,
    price: c.offerPrice ?? c.startingPrice,
    highlights: c.highlights,
    image: c.thumbnail || c.coverBanner || destination.thumbnailImage || destination.bannerImage || "",
    tag: c.isFeatured ? "Featured" : undefined,
    campaignSlug: c.slug,
  }));

  const heroImage = destination.bannerImage || destination.thumbnailImage || "";

  return (
    <main className="relative min-h-screen bg-slate-50">
      {/* Sticky top bar - stays visible while user scrolls through packages */}
      <header className="sticky top-0 inset-x-0 z-[60] bg-slate-900/70 backdrop-blur-xl border-b border-white/10 pointer-events-auto">
        <div className="relative z-[60] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between pointer-events-auto">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex items-center pointer-events-auto cursor-pointer"
          >
            <Logo size="sm" tone="light" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors pointer-events-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[78vh] min-h-[520px] w-full -mt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src={heroImage}
            alt={destination.name}
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
            {destination.country}
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            {destination.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base sm:text-lg md:text-xl text-slate-200/95">
            {destination.shortDescription}
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/plan-trip?destination=${encodeURIComponent(destination.name)}`}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all"
            >
              Plan a {destination.name} Trip
              <ArrowRight className="w-4 h-4" />
            </Link>
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
      <section id="packages" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            {packages.length} curated campaigns
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
            {destination.name} Packages
          </h2>
          <p className="mt-3 text-slate-500">
            Hand-picked itineraries by our travel experts. Tap any package to enquire.
          </p>
        </div>

        <DestinationPackagesGrid
          packages={packages}
          destinationName={destination.name}
        />
      </section>
    </main>
  );
}
