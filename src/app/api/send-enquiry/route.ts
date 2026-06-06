import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { EnquiryPayload } from "@/types/enquiry";

export const runtime = "nodejs"; // Nodemailer needs the Node runtime

const RECIPIENT = "davidsalamon2202@gmail.com";

/**
 * Server-side enquiry email endpoint.
 * Uses Gmail SMTP via Nodemailer with credentials kept in .env.local.
 *
 * Required env vars:
 *   EMAIL_USER  e.g. kargilbhuvana@gmail.com
 *   EMAIL_PASS  Google App Password (NOT the account password)
 *
 * Generate an App Password at https://myaccount.google.com/apppasswords
 * (requires 2-Step Verification on the sending account).
 */
function buildTransport() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER / EMAIL_PASS env vars are missing. " +
        "Add them to .env.local (see .env.local.example).",
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function isValid(p: Partial<EnquiryPayload>): p is EnquiryPayload {
  return Boolean(
    p.destination &&
      p.travellerType &&
      p.travellerCount &&
      p.duration &&
      p.departureCity &&
      p.departureDate &&
      p.customerName &&
      p.customerEmail &&
      p.customerPhone,
  );
}

function plainTextBody(p: EnquiryPayload): string {
  return [
    "New Travel Enquiry",
    "",
    `Destination: ${p.destination}`,
    `Traveller Type: ${p.travellerType}`,
    `Traveller Count: ${p.travellerCount}`,
    `Duration: ${p.duration} Days`,
    `Departure City: ${p.departureCity}`,
    `Departure Date: ${p.departureDate}`,
    "",
    `Customer Name: ${p.customerName}`,
    `Customer Email: ${p.customerEmail}`,
    `Customer Phone: ${p.customerPhone}`,
  ].join("\n");
}

function htmlBody(p: EnquiryPayload): string {
  const row = (k: string, v: string | number) => `
    <tr>
      <td style="padding:10px 16px;background:#f1f5f9;font-weight:600;color:#0f172a;width:42%;border-bottom:1px solid #e2e8f0;">${k}</td>
      <td style="padding:10px 16px;color:#334155;border-bottom:1px solid #e2e8f0;">${v}</td>
    </tr>`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#fff;padding:24px;border-radius:18px 18px 0 0;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;opacity:.85;">D2D Holidays</div>
      <h1 style="margin:6px 0 0;font-size:22px;">New Travel Enquiry Received</h1>
    </div>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 18px 18px;overflow:hidden;">
      ${row("Destination", p.destination)}
      ${row("Traveller Type", p.travellerType)}
      ${row("Traveller Count", p.travellerCount)}
      ${row("Duration", p.duration + " Days")}
      ${row("Departure City", p.departureCity)}
      ${row("Departure Date", p.departureDate)}
      ${row("Customer Name", p.customerName)}
      ${row("Customer Email", p.customerEmail)}
      ${row("Customer Phone", p.customerPhone)}
    </table>
    <p style="margin-top:18px;font-size:12px;color:#64748b;">Sent automatically by the D2D Holidays website.</p>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Partial<EnquiryPayload>;
    if (!isValid(payload)) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    const transport = buildTransport();

    await transport.sendMail({
      from: `"D2D Holidays" <${process.env.EMAIL_USER}>`,
      to: RECIPIENT,
      replyTo: payload.customerEmail,
      subject: "New Travel Enquiry Received",
      text: plainTextBody(payload),
      html: htmlBody(payload),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/send-enquiry]", err);
    const message =
      err instanceof Error ? err.message : "Unable to send email.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
