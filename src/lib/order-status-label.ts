import { en } from "@/lib/site-copy";

export function orderStatusLabel(status: string): string {
  const key = status as keyof typeof en.orderStatus;
  return en.orderStatus[key] ?? status;
}

export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return "";
  const key = status as keyof typeof en.paymentStatus;
  return en.paymentStatus[key] ?? status;
}

export function adminPaymentMethodLabel(
  method: string | null | undefined,
): string {
  if (!method) return "—";
  if (method === "cod") return en.admin.paymentCodShort;
  if (method === "stripe") return en.admin.paymentCardShort;
  return method;
}
