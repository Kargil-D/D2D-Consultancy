"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50",
  secondary:
    "bg-white text-slate-900 hover:bg-slate-100 shadow-md",
  ghost:
    "bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20",
  outline:
    "border border-slate-300 text-slate-900 hover:border-cyan-500 hover:text-cyan-600",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

/**
 * Reusable animated button component.
 * Used across navbar, hero, and cards for a consistent design system.
 */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-300 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
