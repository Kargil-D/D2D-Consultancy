"use client";

import type { DestinationPackage } from "@/data/destinationPackages";
import DestinationPackageCard from "./DestinationPackageCard";

interface DestinationPackagesGridProps {
  packages: DestinationPackage[];
  destinationName: string;
}

/**
 * Responsive grid of destination packages.
 *
 * Breakpoints:
 *   - mobile  : 1 column
 *   - tablet  : 2 columns (sm+)
 *   - desktop : 3 columns (lg+)
 */
export default function DestinationPackagesGrid({
  packages,
  destinationName,
}: DestinationPackagesGridProps) {
  if (!packages.length) {
    return (
      <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-500">
        No packages available right now. Please check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {packages.map((pkg, idx) => (
        <DestinationPackageCard
          key={pkg.id}
          pkg={pkg}
          destinationName={destinationName}
          index={idx}
        />
      ))}
    </div>
  );
}
