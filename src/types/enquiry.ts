import type { TravellerId } from ".";

/** Customer contact details collected on the final planner step. */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

/** Full enquiry payload submitted to Google Forms + email API. */
export interface EnquiryPayload {
  destination: string;
  travellerType: TravellerId;
  travellerCount: number;
  /** Adult count (defaults to travellerCount for non-family types). */
  adultsCount?: number;
  /** Children count (only set for family bookings). */
  childrenCount?: number;
  duration: string;
  departureCity: string;
  /** Preferred expert language (e.g. "English", "Tamil"). */
  language?: string;
  departureDate: string; // ISO yyyy-mm-dd
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface EnquiryResult {
  ok: boolean;
  message?: string;
}
