import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/apiError";
import type { ApiResponse } from "@/types/admin";

export function ok<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, message, data }, { status });
}

function fail(message: string, status: number) {
  return NextResponse.json<ApiResponse<null>>(
    { success: false, message, data: null },
    { status },
  );
}

type RouteHandler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<NextResponse>;

/**
 * Central error boundary for /api/auth routes — replaces per-route try/catch so
 * ApiError (expected, user-facing) and unexpected errors both map to the
 * standard ApiResponse envelope instead of leaking stack traces to clients.
 */
export function withApiHandler<Ctx = unknown>(tag: string, handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.message, err.statusCode);
      }
      if (err instanceof ZodError) {
        const message = err.issues[0]?.message ?? "Invalid input";
        return fail(message, 400);
      }
      console.error(tag, err);
      return fail("Internal server error", 500);
    }
  };
}
