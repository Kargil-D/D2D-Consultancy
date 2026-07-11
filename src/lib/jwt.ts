import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "@/lib/apiError";

const ACCESS_TOKEN_TTL = "15m";
const RESET_TICKET_TTL = "5m";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: string;
  typ: "access";
}

export interface ResetTicketPayload {
  sub: string; // otpId
  email: string;
  typ: "reset";
}

export async function signAccessToken(payload: Omit<AccessTokenPayload, "typ">): Promise<string> {
  return new SignJWT({ ...payload, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.typ !== "access") throw new Error("wrong token type");
    return payload as unknown as AccessTokenPayload;
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }
}

export async function signResetTicket(payload: Omit<ResetTicketPayload, "typ">): Promise<string> {
  return new SignJWT({ ...payload, typ: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(RESET_TICKET_TTL)
    .sign(getSecretKey());
}

export async function verifyResetTicket(token: string): Promise<ResetTicketPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.typ !== "reset") throw new Error("wrong token type");
    return payload as unknown as ResetTicketPayload;
  } catch {
    throw new ApiError(400, "Reset link expired or invalid. Please verify the OTP again.");
  }
}
