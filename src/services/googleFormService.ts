import type { EnquiryPayload } from "@/types/enquiry";

/**
 * Google Forms submission service.
 *
 * ---------------------------------------------------------------------------
 * SETUP ï¿½ replace GOOGLE_FORM_ACTION_URL and Google entry IDs
 * ---------------------------------------------------------------------------
 * 1. Create a Google Form (owned by kargilbhuvana@gmail.com is fine,
 *    or any account whose Sheet you want).
 * 2. Add 9 short-answer questions in the order below (matches `ENTRY_IDS`).
 * 3. Click "Send" -> copy the form URL ending in /viewform.
 *    Replace /viewform with /formResponse and put it below.
 * 4. To get each entry ID:
 *      Form editor -> ? -> "Get pre-filled link" -> fill dummies -> "Get link".
 *      The resulting URL contains entry.NNNNNNNNN per field. Paste here.
 *
 * Submission uses `mode: "no-cors"` because Google Forms doesn't return CORS
 * headers. The response is opaque so we treat absence of an error as success.
 * ---------------------------------------------------------------------------
 */
const GOOGLE_FORM_ACTION_URL =
  process.env.NEXT_PUBLIC_GOOGLE_FORM_URL ??
  "https://docs.google.com/forms/d/e/REPLACE_WITH_FORM_ID/formResponse";

const ENTRY_IDS = {
  destination:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_DESTINATION ?? "entry.1111111111",
  travellerType:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_TRAVELLER_TYPE ?? "entry.2222222222",
  travellerCount:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_TRAVELLER_COUNT ?? "entry.3333333333",
  duration: process.env.NEXT_PUBLIC_GFORM_ENTRY_DURATION ?? "entry.4444444444",
  departureCity:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_CITY ?? "entry.5555555555",
  departureDate:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_DATE ?? "entry.6666666666",
  customerName:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_NAME ?? "entry.7777777777",
  customerEmail:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_EMAIL ?? "entry.8888888888",
  customerPhone:
    process.env.NEXT_PUBLIC_GFORM_ENTRY_PHONE ?? "entry.9999999999",
} as const;

const isPlaceholderUrl = (url: string) => url.includes("REPLACE_WITH_FORM_ID");

/**
 * Submit an enquiry to the configured Google Form.
 * Resolves quietly if env vars are still placeholders so the rest of the
 * flow (email + redirect) keeps working in development.
 */
export async function submitToGoogleForm(
  payload: EnquiryPayload,
): Promise<{ submitted: boolean }> {
  if (isPlaceholderUrl(GOOGLE_FORM_ACTION_URL)) {
    // No real form configured yet ï¿½ log for the developer and skip.
    console.warn(
      "[googleFormService] GOOGLE_FORM_ACTION_URL is a placeholder. " +
        "Set NEXT_PUBLIC_GOOGLE_FORM_URL and entry IDs in .env.local.",
    );
    return { submitted: false };
  }

  const body = new URLSearchParams();
  body.append(ENTRY_IDS.destination, payload.destination);
  body.append(ENTRY_IDS.travellerType, payload.travellerType);
  body.append(ENTRY_IDS.travellerCount, String(payload.travellerCount));
  body.append(ENTRY_IDS.duration, payload.duration);
  body.append(ENTRY_IDS.departureCity, payload.departureCity);
  body.append(ENTRY_IDS.departureDate, payload.departureDate);
  body.append(ENTRY_IDS.customerName, payload.customerName);
  body.append(ENTRY_IDS.customerEmail, payload.customerEmail);
  body.append(ENTRY_IDS.customerPhone, payload.customerPhone);

  await fetch(GOOGLE_FORM_ACTION_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return { submitted: true };
}
