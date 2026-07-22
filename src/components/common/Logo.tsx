"use client";

import { type CSSProperties } from "react";

interface LogoProps {
  /** Visual size variant */
  size?: "sm" | "md" | "lg";
  /** Render the wordmark + slogan beside the badge */
  showWordmark?: boolean;
  /** Force light/dark text (e.g. on transparent hero vs. white nav) */
  tone?: "light" | "dark";
  className?: string;
}

const SIZE_PX: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

/**
 * D2D Holidays brand mark.
 *
 * Concept: a folded paper airplane in flight, teal-to-cyan gradient — a
 * literal visualization of "Drive to Destination" travel. Carries its own
 * fixed brand gradient (no colored container needed), so it reads cleanly
 * on both the dark hero navbar and white surfaces.
 */
export default function Logo({
  size = "md",
  showWordmark = true,
  tone = "dark",
  className = "",
}: LogoProps) {
  const dim = SIZE_PX[size];
  const style: CSSProperties = { width: dim, height: dim };

  const titleColor = tone === "light" ? "text-white" : "text-slate-900";
  const sloganColor = tone === "light" ? "text-cyan-200/90" : "text-slate-500";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {/* SVG mark */}
      <span style={style} className="relative inline-flex items-center justify-center" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="d2dPlaneGrad" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#0d9488" />
              <stop offset="1" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
          {/* Main wing (folded paper body) */}
          <path d="M96 8 L3 42 L50 60 Z" fill="url(#d2dPlaneGrad)" />
          {/* Folded tail facet — same gradient field, different corner */}
          <path d="M96 8 L50 60 L42 95 Z" fill="url(#d2dPlaneGrad)" />
          {/* Fold crease */}
          <path d="M96 8 L50 60" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
        </svg>
      </span>

      {/* Wordmark */}
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={`font-heading font-extrabold tracking-tight ${titleColor} ${
              size === "lg" ? "text-2xl" : "text-xl"
            }`}
          >
            D2D <span className="text-cyan-400">Holidays</span>
          </span>
          <span
            className={`mt-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] ${sloganColor}`}
          >
            Drive to Destination
          </span>
        </span>
      )}
    </span>
  );
}
