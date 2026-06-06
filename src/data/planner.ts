import type { Traveller, TravellerId } from "@/types";

export const TRAVELLER_OPTIONS: Traveller[] = [
  {
    id: "couple",
    title: "Couple",
    description: "Romantic escapes for two",
    image:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "family",
    title: "Family",
    description: "Memorable trips with loved ones",
    image:
      "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "friends",
    title: "Friends",
    description: "Adventures with your crew",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "solo",
    title: "Solo",
    description: "Discover yourself, your way",
    image:
      "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80",
  },
];

/**
 * Min / max / default count rules per traveller type.
 * Couple and Solo are fixed (locked count); Family and Friends are user-adjustable.
 */
export const TRAVELLER_COUNT_RULES: Record<
  TravellerId,
  { min: number; max: number; default: number; locked: boolean }
> = {
  couple: { min: 2, max: 2, default: 2, locked: true },
  solo: { min: 1, max: 1, default: 1, locked: true },
  family: { min: 3, max: 20, default: 3, locked: false },
  friends: { min: 2, max: 20, default: 2, locked: false },
};

export const DURATION_OPTIONS = [
  { id: "3", label: "3 Days", hint: "Quick getaway" },
  { id: "5", label: "5 Days", hint: "Short break" },
  { id: "7", label: "7 Days", hint: "Most popular" },
  { id: "10", label: "10 Days", hint: "Extended trip" },
  { id: "14", label: "14 Days", hint: "Grand vacation" },
  { id: "custom", label: "Custom", hint: "Pick your own" },
] as const;

/**
 * Languages a customer can pick so we pair them with an expert who
 * speaks their preferred language. Order mirrors the reference UI.
 */
export const LANGUAGE_OPTIONS = [
  { id: "english", label: "English" },
  { id: "hindi", label: "Hindi" },
  { id: "tamil", label: "Tamil" },
  { id: "telugu", label: "Telugu" },
  { id: "malayalam", label: "Malayalam" },
  { id: "kannada", label: "Kannada" },
  { id: "marathi", label: "Marathi" },
  { id: "gujarati", label: "Gujarati" },
  { id: "punjabi", label: "Punjabi" },
  { id: "bengali", label: "Bengali" },
] as const;
