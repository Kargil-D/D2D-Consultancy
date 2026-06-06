"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Plane, Palmtree, Mountain, Globe2 } from "lucide-react";
import Logo from "@/components/common/Logo";

const QUOTES = [
  {
    text: "Travel far, travel wide, travel deep.",
    author: "D2D Holidays",
  },
  {
    text: "Adventure awaits — your next chapter begins here.",
    author: "Explorer's Creed",
  },
  {
    text: "Collect moments, not things.",
    author: "Travel Wisdom",
  },
  {
    text: "The world is a book, and those who do not travel read only one page.",
    author: "Saint Augustine",
  },
];

const FLOATERS = [
  { Icon: Plane, x: "12%", y: "18%", delay: 0, size: 22 },
  { Icon: Palmtree, x: "78%", y: "22%", delay: 1.2, size: 26 },
  { Icon: Mountain, x: "20%", y: "72%", delay: 0.6, size: 24 },
  { Icon: Compass, x: "82%", y: "68%", delay: 1.8, size: 22 },
  { Icon: Globe2, x: "50%", y: "85%", delay: 2.4, size: 20 },
];

export default function AnimatedBackground() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden text-white">
      {/* Travel background image */}
      <Image
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
        alt="Tropical paradise"
        fill
        sizes="(max-width: 1024px) 0px, 50vw"
        priority
        className="object-cover scale-110"
      />

      {/* Gradient overlays — deep blue ? ocean ? sunset orange */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-cyan-800/70 to-orange-500/60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.45),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(251,146,60,0.35),transparent_60%)]" />

      {/* Floating travel icons */}
      {FLOATERS.map(({ Icon, x, y, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute text-white/30"
          style={{ left: x, top: y }}
          animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
          transition={{
            duration: 6 + i,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon style={{ width: size, height: size }} />
        </motion.div>
      ))}

      {/* Glass content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8 lg:p-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <Logo size="sm" tone="light" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-semibold uppercase tracking-widest">
            <Compass className="w-3.5 h-3.5 text-cyan-200" />
            Welcome back
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
            Explore the World{" "}
            <span className="bg-gradient-to-r from-cyan-200 via-teal-200 to-orange-200 bg-clip-text text-transparent">
              with Us
            </span>
          </h2>
          <p className="text-sm lg:text-base text-white/80 max-w-sm">
            Sign in to continue planning your dream vacation. Your itineraries,
            saved trips and quotes — all in one place.
          </p>
        </div>

        {/* Rotating quote */}
        <div className="relative h-28">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 lg:p-5 shadow-2xl shadow-black/20"
            >
              <p className="text-sm lg:text-base font-medium italic">
                &ldquo;{QUOTES[idx].text}&rdquo;
              </p>
              <footer className="mt-2 text-[11px] uppercase tracking-widest text-white/60">
                — {QUOTES[idx].author}
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
