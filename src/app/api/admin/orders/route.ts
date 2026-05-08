import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { listOrdersForAdmin } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "80") || 80;
  const orders = await listOrdersForAdmin(limit);
  return NextResponse.json({ orders });
}
