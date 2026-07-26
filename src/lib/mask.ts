/** Renders masked Aadhaar/bank account numbers from a stored last-4-digit sidecar, never from the decrypted value. */
export function maskAadhaar(last4: string | null | undefined): string {
  return last4 ? `XXXX XXXX ${last4}` : "";
}

export function maskAccountNumber(last4: string | null | undefined): string {
  return last4 ? `XXXXXXXX${last4}` : "";
}
