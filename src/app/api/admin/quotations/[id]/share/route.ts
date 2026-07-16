import { NextResponse } from "next/server";
import { generateShareLink } from "@/services/quotationService";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const token = await generateShareLink(id);
    const url = new URL(req.url);
    const shareUrl = `${url.protocol}//${url.host}/quote/${token}`;
    return NextResponse.json({ success: true, message: "Link generated", data: { token, url: shareUrl } });
  } catch (err) {
    console.error("[/api/admin/quotations/[id]/share] POST", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
