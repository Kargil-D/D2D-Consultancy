"use client";

import Image from "next/image";
import { Bed } from "lucide-react";

interface CampaignHotelGalleryProps {
  images: string[];
  alt: string;
}

/**
 * Horizontally scrollable image strip for a hotel's photos. Snap-scrolls
 * one image at a time — works with touch swipe, trackpad, or a mouse wheel.
 */
export default function CampaignHotelGallery({ images, alt }: CampaignHotelGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[240px] bg-slate-100 flex items-center justify-center text-slate-400">
        <Bed className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[240px] bg-slate-100 overflow-x-auto snap-x snap-mandatory flex [scrollbar-width:thin]">
      {images.map((src, i) => (
        <div key={i} className="relative w-full h-full flex-shrink-0 snap-center">
          <Image src={src} alt={`${alt} ${i + 1}`} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" unoptimized />
        </div>
      ))}
    </div>
  );
}
