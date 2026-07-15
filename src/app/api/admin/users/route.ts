import { NextResponse } from "next/server";
import { listUsersByRole } from "@/services/userService";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role") ?? "Sales";
    const users = await listUsersByRole(role);
    return NextResponse.json({ success: true, message: "OK", data: users });
  } catch (err) {
    console.error("[/api/admin/users] GET", err);
    return NextResponse.json({ success: false, message: "Internal error", data: null }, { status: 500 });
  }
}
