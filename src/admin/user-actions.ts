"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { setUserBanState, setUserSoftDelete } from "@/lib/admin/users";

export async function adminUserBanForm(formData: FormData) {
  const s = await getAdminSession();
  if (!s) redirect("/");
  const userId = String(formData.get("userId") ?? "");
  const banned = formData.get("banned") === "true";
  if (!userId || userId === s.user.id) {
    redirect("/admin/users?toast=Invalid%20user%20action&toastType=error");
  }
  const r = await setUserBanState(userId, banned);
  if (!r.ok) {
    redirect(
      `/admin/users?toast=${encodeURIComponent(r.error ?? "User update failed")}&toastType=error`,
    );
  }
  revalidatePath("/admin/users");
  redirect(
    `/admin/users?toast=${encodeURIComponent(banned ? "User banned" : "User unbanned")}&toastType=success`,
  );
}

export async function adminUserDeleteForm(formData: FormData) {
  const s = await getAdminSession();
  if (!s) redirect("/");
  const userId = String(formData.get("userId") ?? "");
  const deleted = formData.get("deleted") === "true";
  if (!userId || userId === s.user.id) {
    redirect("/admin/users?toast=Invalid%20user%20action&toastType=error");
  }
  const r = await setUserSoftDelete(userId, deleted);
  if (!r.ok) {
    redirect(
      `/admin/users?toast=${encodeURIComponent(r.error ?? "User update failed")}&toastType=error`,
    );
  }
  revalidatePath("/admin/users");
  redirect(
    `/admin/users?toast=${encodeURIComponent(deleted ? "User deleted" : "User restored")}&toastType=success`,
  );
}
