"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import type { DestinationPackage } from "@/data/destinationPackages";
import { formatINR } from "@/utils/format";

interface DestinationPackageCardProps {
  pkg: DestinationPackage;
  destinationName: string;
  index?: number;
}

/**
 * Compact premium destination-package card.
 *
 * Layout (matches the landing-page PackageCard style):
 *   - Top: image with overlay, left tag pill, right duration pill,
 *          destination name written over the bottom of the image
 *   - Bottom: 2-line description, starting price + "Explore" CTA
 *
 * No rating badge, no bullet highlights, no review count -
 * keeps cards short, equal-height and elegant.
 */
export default function DestinationPackageCard({
  pkg,
  destinationName,
  index = 0,
}: DestinationPackageCardProps) {
  const enquireHref = pkg.itineraryId
    ? `/itinerary/${pkg.itineraryId}`
    : `/plan-trip?destination=${encodeURIComponent(
        destinationName
      )}&package=${encodeURIComponent(pkg.title)}`;

  // Build a compact 2-line description from package highlights
  // (or fall back to the title) so the card stays content-light.
  const shortDescription = pkg.highlights?.length
    ? pkg.highlights.slice(0, 3).join(" - ")
    : pkg.title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Link
        href={enquireHref}
        aria-label={`Explore ${pkg.title}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-md shadow-slate-900/5 ring-1 ring-slate-100 transition-shadow duration-500 hover:shadow-2xl hover:shadow-cyan-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        {/* ===== Image ===== */}
        <div className="relative h-56 w-full overflow-hidden sm:h-60">
          <Image
            src={pkg.image}
            alt={pkg.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {/* Dark overlay for badge/title readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 via-slate-900/15 to-slate-900/30" />

          {/* Top row: tag (left) + duration pill (right) */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
            {pkg.tag ? (
              <div className="flex w-fit max-w-[60%] items-center gap-1.5 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 shadow-md ring-1 ring-white/60 backdrop-blur-md">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  {pkg.tag}
                </span>
              </div>
            ) : (
              <span aria-hidden />
            )}

            <div className="flex w-fit max-w-[55%] items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900/65 px-3 py-1.5 shadow-md ring-1 ring-white/10 backdrop-blur-md">
              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-cyan-300" />
              <span className="text-[11px] font-semibold text-white">
                {pkg.duration}
              </span>
            </div>
          </div>

          {/* Bottom: country + destination/package name on image */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-cyan-300" />
              <span className="truncate">{destinationName}</span>
            </div>
            <h3 className="mt-1 truncate text-xl font-bold leading-tight text-white drop-shadow-md sm:text-2xl">
              {pkg.title}
            </h3>
          </div>
        </div>

        {/* ===== Body ===== */}
        <div className="flex flex-1 flex-col p-5">
          <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">
            {shortDescription}
          </p>

          <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Starting from
              </div>
              <div className="text-xl font-bold text-slate-900">
                {formatINR(pkg.price)}
                <span className="ml-1 text-xs font-medium text-slate-500">
                  /person
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/30 transition-transform group-hover:translate-x-0.5">
              Explore
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
