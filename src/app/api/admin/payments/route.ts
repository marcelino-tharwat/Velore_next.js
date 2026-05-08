import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { listPaymentsForAdmin } from "@/lib/admin/payments";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const payments = await listPaymentsForAdmin();
  return NextResponse.json({ payments });
}
