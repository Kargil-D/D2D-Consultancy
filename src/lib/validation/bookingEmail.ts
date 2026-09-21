import { z } from "zod";

export const BookingEmailDraftSchema = z.object({
  recipientType: z.enum(["Customer", "Supplier"]),
  toEmail: z.string().optional().default(""),
  cc: z.string().optional().default(""),
  bcc: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  bodyHtml: z.string().optional().default(""),
});

export const MAX_EMAIL_ATTACHMENTS = 5;
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/** Attachments are uploaded straight to Blob by the mail screen; the server only ever fetches HTTPS URLs on our own Blob host, so this field can't be used to make the server request arbitrary addresses. */
const EmailAttachmentSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  url: z
    .string()
    .url()
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
      } catch {
        return false;
      }
    }, "Attachments must be files uploaded from the mail screen"),
});

export const BookingSendEmailSchema = z.object({
  recipientType: z.enum(["Customer", "Supplier"]),
  toEmail: z.string().email("A valid recipient email is required"),
  cc: z.string().optional().default(""),
  bcc: z.string().optional().default(""),
  subject: z.string().min(1, "Subject is required"),
  bodyHtml: z.string().min(1, "Message body is required"),
  attachments: z.array(EmailAttachmentSchema).max(MAX_EMAIL_ATTACHMENTS, `You can attach up to ${MAX_EMAIL_ATTACHMENTS} files`).optional().default([]),
});

export type BookingEmailDraftInput = z.infer<typeof BookingEmailDraftSchema>;
export type BookingSendEmailInput = z.infer<typeof BookingSendEmailSchema>;
