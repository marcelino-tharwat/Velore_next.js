import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { updateOrderStatusWithRole } from "@/lib/seller/orders";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const role = normalizeRole(session.user.role);
  if (role !== "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await updateOrderStatusWithRole({
    orderId: params.id,
    status: parsed.data.status,
    actorRole: "seller",
    actorUserId: session.user.id,
  });
  if (!result.ok) {
    const status = result.error === "Order not found" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
