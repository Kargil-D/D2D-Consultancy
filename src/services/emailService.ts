import { buildTransport, senderAddress } from "@/lib/mailer";
import type { OtpPurpose } from "@/generated/prisma/client";

function wrapper(title: string, body: string): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#06b6d4,#14b8a6);color:#fff;padding:24px;border-radius:18px 18px 0 0;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;opacity:.85;">D2D Holidays</div>
      <h1 style="margin:6px 0 0;font-size:22px;">${title}</h1>
    </div>
    <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 18px 18px;color:#334155;font-size:14px;line-height:1.6;">
      ${body}
    </div>
    <p style="margin-top:18px;font-size:12px;color:#64748b;">Sent automatically by the D2D Holidays website.</p>
  </div>`;
}

function otpBody(otp: string, purpose: OtpPurpose): string {
  const intent =
    purpose === "Registration" ? "verify your email address" : "reset your password";
  return `
    <p>Use the code below to ${intent}. It expires in <strong>10 minutes</strong>.</p>
    <div style="margin:20px 0;text-align:center;">
      <span style="display:inline-block;padding:14px 28px;border-radius:12px;background:#f0fdfa;border:1px solid #99f6e4;font-size:28px;font-weight:700;letter-spacing:8px;color:#0f766e;">${otp}</span>
    </div>
    <p style="color:#64748b;">If you didn't request this, you can safely ignore this email.</p>`;
}

export async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose) {
  const transport = buildTransport();
  const subject =
    purpose === "Registration" ? "Verify your email — D2D Holidays" : "Reset your password — D2D Holidays";
  await transport.sendMail({
    from: senderAddress(),
    to,
    subject,
    text: `Your D2D Holidays verification code is ${otp}. It expires in 10 minutes.`,
    html: wrapper(subject, otpBody(otp, purpose)),
  });
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  const transport = buildTransport();
  const subject = "Welcome to Drive to Destination Holidays!";
  await transport.sendMail({
    from: senderAddress(),
    to,
    subject,
    text: `Hi ${firstName}, your email is verified and your D2D Holidays account is now active.`,
    html: wrapper(
      subject,
      `<p>Hi ${firstName},</p><p>Your email is verified and your account is now active. You're all set to start planning your next trip with us.</p>`,
    ),
  });
}

export async function sendQuotationEmail(
  to: string,
  opts: { quoteCode: string; customerName: string; destinationName: string; sellingPrice: number; shareUrl?: string; pdfBuffer: Buffer },
) {
  const transport = buildTransport();
  const subject = `Your D2D Holidays Quote ${opts.quoteCode} — ${opts.destinationName}`;
  const priceText = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(opts.sellingPrice);

  await transport.sendMail({
    from: senderAddress(),
    to,
    subject,
    text: `Hi ${opts.customerName}, your quote ${opts.quoteCode} for ${opts.destinationName} is ready. Total price: ${priceText}.`,
    html: wrapper(
      subject,
      `<p>Hi ${opts.customerName},</p>
       <p>Your travel quotation for <strong>${opts.destinationName}</strong> is ready.</p>
       <p style="font-size:20px;font-weight:700;color:#0f766e;">${priceText}</p>
       <p>The full quote is attached as a PDF.${opts.shareUrl ? ` You can also view it online: <a href="${opts.shareUrl}">${opts.shareUrl}</a>` : ""}</p>`,
    ),
    attachments: [{ filename: `${opts.quoteCode}.pdf`, content: opts.pdfBuffer, contentType: "application/pdf" }],
  });
}

export async function sendPasswordResetConfirmationEmail(to: string) {
  const transport = buildTransport();
  const subject = "Your password was changed";
  await transport.sendMail({
    from: senderAddress(),
    to,
    subject,
    text: "Your D2D Holidays account password was just changed. If this wasn't you, please contact support immediately.",
    html: wrapper(
      subject,
      `<p>Your account password was just changed.</p><p style="color:#b91c1c;">If you didn't make this change, please contact our support team immediately.</p>`,
    ),
  });
}
