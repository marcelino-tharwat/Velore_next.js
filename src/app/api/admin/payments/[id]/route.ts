import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin/session";
import { getPaymentForAdmin, updatePaymentAdmin } from "@/lib/admin/payments";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["pending", "paid", "failed"]).optional(),
  transactionId: z.string().max(200).optional(),
  failureReason: z.string().max(500).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const payment = await getPaymentForAdmin(params.id);
  if (!payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ payment });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const r = await updatePaymentAdmin({ id: params.id, ...parsed.data });
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
