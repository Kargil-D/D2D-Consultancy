import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/apiError";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Token-issuing endpoint for Vercel Blob's client-direct-upload flow (@vercel/blob/client's
 * `upload()`). The file itself goes straight from the browser to Blob storage, never through
 * this serverless function's body — necessary because Vercel hard-caps a function's request
 * body at 4.5MB, which a route that received the file directly could hit on its own.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        await getCurrentUser(request);
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No server-side bookkeeping needed — callers persist the returned URL themselves.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[/api/admin/upload] POST", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
