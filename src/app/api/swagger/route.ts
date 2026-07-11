import { NextResponse } from "next/server";
import { createSwaggerSpec } from "next-swagger-doc";

export const runtime = "nodejs";

export function GET() {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api/auth",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "D2D Holidays — Auth API",
        version: "1.0.0",
        description: "Registration, email verification, login, and password-reset endpoints.",
      },
      tags: [{ name: "Auth", description: "Authentication endpoints" }],
    },
  });
  return NextResponse.json(spec);
}
