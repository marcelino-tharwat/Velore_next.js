import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { createUserByAdmin, listUsersForAdmin } from "@/lib/admin/users";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? undefined;
  const includeDeleted = searchParams.get("includeDeleted") === "1";
  const skip = Number(searchParams.get("skip") ?? "0") || 0;
  const limit = Number(searchParams.get("limit") ?? "50") || 50;
  const users = await listUsersForAdmin({ search, includeDeleted, skip, limit });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const r = await createUserByAdmin(body);
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
