import { randomBytes, createHash } from "crypto";

export const REFRESH_TOKEN_TTL_DAYS = 7;

export function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
