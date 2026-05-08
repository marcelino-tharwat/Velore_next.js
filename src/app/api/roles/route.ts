import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { listRoles } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const roles = await listRoles();
  return NextResponse.json({ roles });
}
