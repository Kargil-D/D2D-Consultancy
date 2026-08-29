import { NextResponse, type NextRequest } from "next/server";
import { listQuotations, listQuotationSummaries, createQuotation } from "@/services/quotationService";
import { QuotationCreateSchema } from "@/lib/validation/quotation";
import { ApiError } from "@/lib/apiError";
import { requireModuleAccess, toViewer } from "@/lib/permissions";
import { perfTime } from "@/lib/perf";

export async function GET(req: NextRequest) {
  try {
    const user = await requireModuleAccess(req, "Quotations", "canView");
    const viewer = toViewer(user);
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const leadId = url.searchParams.get("leadId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const salesExecutiveId = url.searchParams.get("salesExecutiveId") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (leadId) filter.leadId = leadId;
    if (status) filter.status = status;
    // Non-admins are already scoped to their own records by listQuotations/listQuotationSummaries — only Admin's explicit choice of sales executive is honored here.
    if (viewer.isAdmin && salesExecutiveId) filter.salesExecutiveId = salesExecutiveId;

    // view=summary: table-sized rows without the itineraryDays/hotelOptions/transfers/
    // activities JSON columns. Lead-scoped consumers that need those columns keep the default.
    const wantSummary = url.searchParams.get("view") === "summary";
    const data = await perfTime(
      "GET /api/admin/quotations",
      () => (wantSummary ? listQuotationSummaries({ search, page, pageSize, filter }, viewer) : listQuotations({ search, page, pageSize, filter }, viewer)),
      (d) => ({ rows: d.items.length, total: d.total, bytes: JSON.stringify(d).length }),
    );
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireModuleAccess(req, "Quotations", "canAdd");
    const viewer = toViewer(user);
    const payload = await req.json();
    const parsed = QuotationCreateSchema.parse(payload);
    if (!viewer.isAdmin && parsed.salesExecutiveId !== undefined && parsed.salesExecutiveId !== viewer.id) {
      delete parsed.salesExecutiveId;
    }
    const created = await createQuotation(parsed);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    if (err instanceof ApiError) return NextResponse.json({ success: false, message: err.message, data: null }, { status: err.statusCode });
    console.error("[/api/admin/quotations] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
