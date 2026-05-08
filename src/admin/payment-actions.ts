"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { updatePaymentAdmin } from "@/lib/admin/payments";

const statuses = ["pending", "paid", "failed"] as const;

export async function adminPaymentUpdateForm(formData: FormData) {
  const s = await getAdminSession();
  if (!s) redirect("/");

  const id = String(formData.get("paymentId") ?? "");
  if (!id) {
    redirect("/admin/orders?toast=Invalid%20payment&toastType=error");
  }

  const statusRaw = String(formData.get("status") ?? "");
  const status = statuses.includes(statusRaw as (typeof statuses)[number])
    ? (statusRaw as (typeof statuses)[number])
    : undefined;

  const transactionId = String(formData.get("transactionId") ?? "").trim();
  const failureReason = String(formData.get("failureReason") ?? "").trim();

  const r = await updatePaymentAdmin({
    id,
    status,
    transactionId: transactionId || undefined,
    failureReason: failureReason || undefined,
  });
  if (!r.ok) {
    redirect(
      `/admin/orders?toast=${encodeURIComponent(r.error ?? "Payment update failed")}&toastType=error`,
    );
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders?toast=Payment%20updated&toastType=success");
}
