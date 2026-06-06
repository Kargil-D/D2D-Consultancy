import type { EnquiryPayload, EnquiryResult } from "@/types/enquiry";
import { submitToGoogleForm } from "./googleFormService";

/**
 * Validates the payload (light client-side guard before network calls).
 */
function validate(payload: EnquiryPayload): string | null {
  if (!payload.destination) return "Destination is required.";
  if (!payload.travellerType) return "Please select a traveller type.";
  if (!payload.travellerCount || payload.travellerCount < 1)
    return "Traveller count is invalid.";
  if (!payload.duration) return "Please select a trip duration.";
  if (!payload.departureCity) return "Please select a departure city.";
  if (!payload.departureDate) return "Please select a departure date.";
  if (!payload.customerName.trim()) return "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(payload.customerEmail))
    return "Please enter a valid email address.";
  if (!/^[+\d\s-]{7,}$/.test(payload.customerPhone))
    return "Please enter a valid phone number.";
  return null;
}

/**
 * Sends the enquiry email via the secure server-side API route.
 */
async function sendEnquiryEmail(payload: EnquiryPayload): Promise<void> {
  const res = await fetch("/api/send-enquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error ?? "Email API returned an error.");
  }
}

/**
 * Orchestrates the full enquiry flow:
 *   1. Validate
 *   2. Submit to Google Form (silent, best-effort)
 *   3. Send enquiry email via /api/send-enquiry
 *
 * Returns once both side-effects have been attempted so the caller can
 * confidently redirect the user.
 */
/**
 * Orchestrates the full enquiry flow:
 *   1. Validate
 *   2. Submit to Google Form (best-effort, silent)
 *   3. Send enquiry email via /api/send-enquiry (best-effort, silent)
 *
 * Both side-effects are best-effort: failures are logged but never block the
 * redirect, so the customer always lands on the destination/packages page.
 * Email setup can be completed later without breaking the user flow.
 */
export async function submitEnquiry(
  payload: EnquiryPayload,
): Promise<EnquiryResult> {
  const validationError = validate(payload);
  if (validationError) return { ok: false, message: validationError };

  const [formResult, emailResult] = await Promise.allSettled([
    submitToGoogleForm(payload),
    sendEnquiryEmail(payload),
  ]);

  if (formResult.status === "rejected") {
    console.warn("[enquiryService] Google Form submission failed:", formResult.reason);
  }
  if (emailResult.status === "rejected") {
    console.warn("[enquiryService] Email send failed (continuing anyway):", emailResult.reason);
  }

  // Always succeed from the user's perspective â€” they proceed to packages.
  return { ok: true };
}
