"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { updateOrderStatusWithRole } from "@/lib/seller/orders";

const allowedStatuses = ["confirmed", "shipped", "delivered"] as const;

export async function sellerUpdateOrderStatus(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;
  if (normalizeRole(session.user.role) !== "seller") return;
  const status = String(formData.get("status") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
    return;
  }
  const result = await updateOrderStatusWithRole({
    orderId,
    status,
    actorRole: "seller",
    actorUserId: session.user.id,
  });
  if (!result.ok) return;
  revalidatePath("/seller/orders");
}
