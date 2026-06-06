// Shared TypeScript types used across the landing page

export interface NavLink {
  label: string;
  href: string;
}

export interface Package {
  id: string;
  title: string;
  destination: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  tag?: string;
}

/**
 * Lightweight destination card used by the landing-page
 * International / Domestic package grids.
 */
export interface DestinationPackage {
  id: string;
  slug: string;       // links to /destinations/[slug]
  name: string;       // e.g. "Maldives"
  country: string;    // e.g. "Indian Ocean" or "Himachal Pradesh"
  description: string;
  duration: string;   // e.g. "5 Days / 4 Nights"
  price: number;      // starting price in INR
  image: string;
  tag?: string;       // optional badge (e.g. "Best Seller")
}

export interface Review {
  id: string;
  name: string;
  destination: string;
  rating: number;
  text: string;
  avatar: string;
}

export type TravellerId =
  | "couple"
  | "family"
  | "friends"
  | "solo";

export interface Traveller {
  id: TravellerId;
  title: string;
  description: string;
  image: string;
}

export type PlannerStep = 0 | 1 | 2 | 3;

export interface PlannerState {
  destination: string;
  traveller: TravellerId | null;
  travellerCount: number | null;
  /** Children count when traveller type is `family`. */
  childrenCount: number | null;
  duration: string | null;
  city: string | null;
  /** Preferred language for the expert. */
  language: string | null;
  date: string | null; // ISO yyyy-mm-dd
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}


