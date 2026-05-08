import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { listOrdersForSeller } from "@/lib/seller/orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = normalizeRole(session.user.role);
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const paidOnly = new URL(req.url).searchParams.get("paidOnly") === "1";
  const orders = await listOrdersForSeller(session.user.id, paidOnly);
  return NextResponse.json({ orders });
}
