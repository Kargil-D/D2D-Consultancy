"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Compass, Star, Users, Globe2 } from "lucide-react";
import DestinationSearch from "@/components/search/DestinationSearch";

const stats = [
  { icon: Globe2, value: "120+", label: "Destinations" },
  { icon: Users, value: "25k+", label: "Happy Travelers" },
  { icon: Star, value: "4.9", label: "Average Rating" },
];

/**
 * Full-screen cinematic hero with overlay, gradient, and animated content.
 */
export default function Hero() {
  return (
    <section
      id="home"
      // overflow-visible so the search dropdown can escape the hero bounds.
      // z-20 keeps the dropdown above the next stacking-context section.
      className="relative z-20 min-h-screen w-full flex items-center justify-center overflow-visible"
    >
      {/* Background image â€” isolated clipping container so the parent stays overflow-visible */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80"
          alt="Tropical beach getaway"
          fill
          priority
          sizes="100vw"
          className="object-cover scale-105"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/55 to-slate-900/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.25),transparent_60%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 text-center overflow-visible">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs sm:text-sm font-medium"
        >
          <Compass className="w-4 h-4 text-cyan-300" />
          Trusted by 25,000+ travelers worldwide
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
        >
          Plan Your{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
            Dream Vacation
          </span>{" "}
          <br className="hidden md:block" />
          Effortlessly
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-200/90 leading-relaxed"
        >
          Customized domestic and international tour campaigns designed by
          travel experts who understand exactly what makes a journey
          unforgettable.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10"
        >
          <DestinationSearch />
          <p className="mt-4 text-xs sm:text-sm text-slate-300/80">
            Popular: Maldives Ã‚Â· Bali Ã‚Â· Dubai Ã‚Â· Switzerland Ã‚Â· Thailand
          </p>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 max-w-2xl mx-auto gap-4 sm:gap-8"
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-3 py-4 sm:p-5"
            >
              <Icon className="w-5 h-5 text-cyan-300 mx-auto" />
              <div className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {value}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-300 uppercase tracking-wider">
                {label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/70 text-xs tracking-widest uppercase"
      >
        Scroll to explore
      </motion.div>
    </section>
  );
}
