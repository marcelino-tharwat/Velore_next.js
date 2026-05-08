"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { updateOrderAdmin } from "@/lib/admin/orders";

const statuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export async function adminOrderUpdateForm(formData: FormData) {
  const s = await getAdminSession();
  if (!s) redirect("/");
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) {
    redirect("/admin/orders?toast=Invalid%20order&toastType=error");
  }
  const statusRaw = String(formData.get("status") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();
  const status = statuses.includes(statusRaw as (typeof statuses)[number])
    ? (statusRaw as (typeof statuses)[number])
    : undefined;
  const r = await updateOrderAdmin(orderId, {
    status,
    trackingNumber: trackingNumber || undefined,
    adminNotes: adminNotes || undefined,
  });
  if (!r.ok) {
    redirect(
      `/admin/orders/${orderId}?toast=${encodeURIComponent(r.error ?? "Order update failed")}&toastType=error`,
    );
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${orderId}?toast=Order%20updated&toastType=success`);
}
