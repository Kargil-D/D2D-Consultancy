import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.EMPLOYEE_ENCRYPTION_KEY;
  if (!raw) throw new Error("Missing EMPLOYEE_ENCRYPTION_KEY environment variable");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("EMPLOYEE_ENCRYPTION_KEY must decode to exactly 32 bytes (base64)");
  return key;
}

/** Encrypts a plaintext value (Aadhaar/bank account number) for storage. Returns base64(iv || authTag || ciphertext). */
export function encryptSensitive(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

/** Reverses encryptSensitive — only call this from a code path that has already checked the caller's role. */
export function decryptSensitive(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
