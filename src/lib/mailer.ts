import nodemailer from "nodemailer";

/**
 * Shared SMTP transport builder.
 * Uses Gmail SMTP via Nodemailer with credentials kept in .env.local.
 *
 * Required env vars:
 *   EMAIL_USER  e.g. kargilbhuvana@gmail.com
 *   EMAIL_PASS  Google App Password (NOT the account password)
 *
 * Generate an App Password at https://myaccount.google.com/apppasswords
 * (requires 2-Step Verification on the sending account).
 */
export function buildTransport() {
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

export function senderAddress(): string {
  return `"D2D Holidays" <${process.env.EMAIL_USER}>`;
}
