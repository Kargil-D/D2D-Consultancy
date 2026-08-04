import { NextResponse, type NextRequest } from "next/server";
import { listLeads, createLead } from "@/services/leadService";
import { LeadCreateSchema } from "@/lib/validation/lead";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Leads", "canView");
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const source = url.searchParams.get("source") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const assignedToId = url.searchParams.get("assignedToId") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (assignedToId) filter.assignedToId = assignedToId;

    const data = await listLeads({ search, page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/leads] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireModuleAccess(req, "Leads", "canAdd");
    const payload = await req.json();
    const parsed = LeadCreateSchema.parse(payload);
    const created = await createLead(parsed);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/leads] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
