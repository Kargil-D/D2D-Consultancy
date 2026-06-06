"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ChevronDown, MapPin } from "lucide-react";
import {
  DESTINATIONS_MENU,
  type DestinationMenuColumn,
  type DestinationMenuItem,
} from "@/data/destinationsMenu";

interface DestinationsMegaMenuProps {
  /** Whether the dropdown is open (desktop hover state). */
  open: boolean;
  /** Whether the parent navbar is in its scrolled (light) state. */
  scrolled: boolean;
  /** Open / close handlers wired up by the navbar to support hover grace. */
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  /** Optional focus handlers for keyboard a11y. */
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Premium "Destinations" mega-menu used by the desktop navbar.
 *
 * - Hover/focus opens a wide glassy popover with two columns
 *   (International + Domestic).
 * - Each item is a small image card with a tagline + arrow CTA.
 * - Animates with Framer Motion (fade + slide).
 * - Mobile uses a separate accordion (see DestinationsMegaMenuMobile).
 */
export default function DestinationsMegaMenu({
  open,
  scrolled,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}: DestinationsMegaMenuProps) {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        className={`group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
          scrolled
            ? "text-slate-700 hover:text-cyan-600"
            : "text-white/90 hover:text-white"
        }`}
      >
        Destinations
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
        <span className="absolute left-4 right-4 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-cyan-500 to-teal-500 transition-transform duration-300 group-hover:scale-x-100" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            role="menu"
            aria-label="Destinations"
            className="absolute left-1/2 top-full z-50 mt-2 w-[min(92vw,620px)] -translate-x-1/2"
          >
            {/* Pointer */}
            <div className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border border-white/60 bg-white/95 shadow-sm" />

            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
              {/* Soft top gradient accent */}
              <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b from-cyan-50/80 via-white/0 to-transparent" />

              <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {DESTINATIONS_MENU.map((column) => (
                  <Column key={column.title} column={column} />
                ))}
              </div>

              <div className="relative mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                  Curated by our destination experts
                </span>
                <Link
                  href="/#destinations"
                  className="inline-flex items-center gap-1 font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
                >
                  View all destinations
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Column({ column }: { column: DestinationMenuColumn }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-900">
          {column.title}
        </h3>
        <span className="text-[11px] text-slate-400">{column.subtitle}</span>
      </div>

      <ul className="space-y-1" role="none">
        {column.items.map((item) => (
          <li key={item.name} role="none">
            <DestinationCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DestinationCard({ item }: { item: DestinationMenuItem }) {
  return (
    <Link
      href={item.href}
      role="menuitem"
      className="group/card relative flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 transition-all duration-300 hover:border-cyan-100 hover:bg-gradient-to-r hover:from-cyan-50/80 hover:to-white hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      {/* Thumbnail */}
      <span className="relative block h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-110"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
      </span>

      {/* Text */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900 group-hover/card:text-cyan-700">
          {item.name}
        </span>
        <span className="block truncate text-xs text-slate-500">
          {item.tagline}
        </span>
      </span>

      {/* CTA arrow */}
      <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-300 group-hover/card:bg-cyan-500 group-hover/card:text-white group-hover/card:shadow-md group-hover/card:shadow-cyan-500/30">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile accordion variant                                                   */
/* -------------------------------------------------------------------------- */

interface DestinationsMegaMenuMobileProps {
  /** Called whenever a destination link is tapped, so the drawer can close. */
  onNavigate: () => void;
}

/**
 * Mobile-friendly accordion. Renders both columns as collapsible groups
 * inside the navbar's mobile drawer.
 */
export function DestinationsMegaMenuMobile({
  onNavigate,
}: DestinationsMegaMenuMobileProps) {
  return (
    <div className="space-y-3">
      {DESTINATIONS_MENU.map((column) => (
        <MobileColumn
          key={column.title}
          column={column}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function MobileColumn({
  column,
  onNavigate,
}: {
  column: DestinationMenuColumn;
  onNavigate: () => void;
}) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-cyan-50">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-cyan-500" />
          {column.title} Destinations
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-300 group-open:rotate-180" />
      </summary>

      <ul className="space-y-1 px-2 pb-3 pt-1">
        {column.items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cyan-50"
            >
              <span className="relative block h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {item.tagline}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
