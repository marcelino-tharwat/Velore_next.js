import { redirect } from "next/navigation";

/** @deprecated Use /admin/orders (combined orders & payments table). */
export default function AdminPaymentsRedirectPage() {
  redirect("/admin/orders");
}
