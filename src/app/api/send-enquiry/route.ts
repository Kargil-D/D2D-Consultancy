import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { findDestinationByNameOrSlug } from "@/services/destinationService";
import { createLead } from "@/services/leadService";
import { toSlug } from "@/utils/slug";
import { EnquirySchema } from "@/lib/validation/enquiry";
import type { EnquiryPayload } from "@/types/enquiry";

export const runtime = "nodejs";

/**
 * Public plan-trip funnel submits here. Persists straight to the Lead table (source
 * "Website") so it shows up on /admin/leads — this used to also email a hardcoded
 * personal inbox and only saved the Lead as a best-effort side effect of that email
 * succeeding, which meant the whole submission was lost whenever the mailer wasn't
 * configured. Saving the Lead is now the actual point of this endpoint.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let payload: EnquiryPayload;
    try {
      payload = EnquirySchema.parse(body);
    } catch (err) {
      const message = err instanceof ZodError ? err.issues[0]?.message ?? "Invalid input" : "Invalid input";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    const destination =
      (await findDestinationByNameOrSlug(toSlug(payload.destination))) ??
      (await findDestinationByNameOrSlug(payload.destination));
    if (!destination) {
      return NextResponse.json(
        { ok: false, error: `Couldn't match "${payload.destination}" to a destination. Please try again from a destination page.` },
        { status: 400 },
      );
    }

    await createLead({
      customerName: payload.customerName,
      mobile: payload.customerPhone,
      email: payload.customerEmail,
      destinationId: destination.id,
      travelDate: payload.departureDate ? new Date(payload.departureDate) : undefined,
      source: "Website",
      travellerCount: payload.travellerCount,
      adults: payload.adultsCount,
      children: payload.childrenCount,
      remarks: `Traveller type: ${payload.travellerType}; duration: ${payload.duration} days; departure city: ${payload.departureCity}${payload.language ? `; preferred language: ${payload.language}` : ""}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/send-enquiry]", err);
    const message = err instanceof Error ? err.message : "Unable to save enquiry.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
