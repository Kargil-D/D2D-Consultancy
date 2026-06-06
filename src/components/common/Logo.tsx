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
 * Concept: two location pins (your doorstep ? your dreamland) linked by a
 * dashed flight arc with a plane in flight ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â a literal visualization of
 * "Doorstep to Dreamland" travel.
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
  const sloganColor = tone === "light" ? "text-cyan-200/90" : "text-cyan-600";

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {/* SVG mark */}
      <span
        style={style}
        className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 shadow-lg shadow-cyan-500/30"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          width="70%"
          height="70%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dashed flight arc connecting the two pins */}
          <path
            d="M10 36 C 18 8, 30 8, 38 36"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="2 3"
            opacity="0.85"
          />

          {/* Origin pin (doorstep) */}
          <circle cx="10" cy="36" r="3.2" fill="white" />
          <circle cx="10" cy="36" r="1.2" fill="#0f766e" />

          {/* Destination pin (dreamland) */}
          <circle cx="38" cy="36" r="3.2" fill="white" />
          <circle cx="38" cy="36" r="1.2" fill="#0f766e" />

          {/* Plane mid-arc */}
          <g transform="translate(24 12) rotate(45)">
            <path
              d="M0 -5 L1.6 1.6 L7 3 L1.6 4.2 L0 9 L-1.6 4.2 L-7 3 L-1.6 1.6 Z"
              fill="white"
            />
          </g>
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
            Doorstep to Dreamland
          </span>
        </span>
      )}
    </span>
  );
}
