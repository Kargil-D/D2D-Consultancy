import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/apiError";
import { signAccessToken } from "@/lib/jwt";
import { generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_DAYS } from "@/lib/refreshToken";
import type { User, Role } from "@/generated/prisma/client";

interface UserWithRole extends User {
  role: Role;
}

export async function issueTokenPair(user: UserWithRole) {
  const accessToken = await signAccessToken({ sub: user.id, email: user.email, role: user.role.name });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashRefreshToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { role: true } } },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  return issueTokenPair(record.user);
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
