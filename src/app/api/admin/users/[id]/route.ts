import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/session";
import { setUserBanState, setUserSoftDelete, setUserRole } from "@/lib/admin/users";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  banned: z.boolean().optional(),
  deleted: z.boolean().optional(),
  role: z.string().min(1).max(64).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot modify your own account this way" },
      { status: 400 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { banned, deleted, role } = parsed.data;
  if (banned === undefined && deleted === undefined && role === undefined) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }
  if (banned !== undefined) {
    const r = await setUserBanState(params.id, banned);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  }
  if (deleted !== undefined) {
    const r = await setUserSoftDelete(params.id, deleted);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  }
  if (role !== undefined) {
    const r = await setUserRole(params.id, role);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
