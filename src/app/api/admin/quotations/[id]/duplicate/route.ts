import { NextResponse } from "next/server";
import { duplicateQuotation } from "@/services/quotationService";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const copy = await duplicateQuotation(id);
    return NextResponse.json({ success: true, message: "Duplicated", data: copy });
  } catch (err) {
    console.error("[/api/admin/quotations/[id]/duplicate] POST", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
