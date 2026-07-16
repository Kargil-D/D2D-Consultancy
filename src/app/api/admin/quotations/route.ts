import { NextResponse } from "next/server";
import { listQuotations, createQuotation } from "@/services/quotationService";
import { QuotationCreateSchema } from "@/lib/validation/quotation";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const leadId = url.searchParams.get("leadId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;

    const filter: Record<string, unknown> = {};
    if (leadId) filter.leadId = leadId;
    if (status) filter.status = status;

    const data = await listQuotations({ search, page, pageSize, filter });
    return NextResponse.json({ success: true, message: "OK", data });
  } catch (err) {
    console.error("[/api/admin/quotations] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = QuotationCreateSchema.parse(payload);
    const created = await createQuotation(parsed);
    return NextResponse.json({ success: true, message: "Created", data: created });
  } catch (err) {
    console.error("[/api/admin/quotations] POST", err);
    const msg = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 400 });
  }
}
