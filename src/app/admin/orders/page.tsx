import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { listOrdersForAdmin } from "@/lib/admin/orders";
import { adminPaymentUpdateForm } from "@/admin/payment-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format-date";
import {
  adminPaymentMethodLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/order-status-label";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getAdminSession();
  if (!session) return null;
  const orders = await listOrdersForAdmin(100);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Orders &amp; payments
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        {en.admin.ordersIntro} Payment records from checkout appear in the same row — update
        status, transaction id, and notes without leaving this table.
      </p>
      {orders.length === 0 ? (
        <div className="mt-10">
          <EmptyState title={en.admin.ordersEmpty} />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border bg-muted-bg/50 dark:bg-muted-bg/10">
              <tr>
                <th className="px-3 py-3 font-medium text-foreground">
                  {en.admin.thOrder}
                </th>
                <th className="px-3 py-3 font-medium text-foreground">
                  {en.admin.thCustomer}
                </th>
                <th className="px-3 py-3 font-medium text-foreground">
                  {en.admin.thItems}
                </th>
                <th className="px-3 py-3 font-medium text-foreground">
                  {en.admin.thTotal}
                </th>
                <th className="px-3 py-3 font-medium text-foreground">
                  {en.admin.thStatus}
                </th>
                <th className="px-3 py-3 font-medium text-foreground">
                  {en.admin.thPayment}
                </th>
                <th className="min-w-[240px] px-3 py-3 font-medium text-foreground">
                  Payment record
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border align-top last:border-0">
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      #{o.id.slice(-8)}
                    </Link>
                    <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3">{o.customerEmail}</td>
                  <td className="px-3 py-3">{o.itemCount}</td>
                  <td className="px-3 py-3 tabular-nums font-medium">
                    ${o.total.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">{orderStatusLabel(o.status)}</td>
                  <td className="px-3 py-3 text-muted">
                    {adminPaymentMethodLabel(o.paymentMethod)}
                    {o.paymentStatus ? (
                      <span className="mt-0.5 block text-xs text-foreground">
                        {paymentStatusLabel(o.paymentStatus)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    {o.paymentId ? (
                      <form
                        action={adminPaymentUpdateForm}
                        className="flex max-w-xs flex-col gap-2"
                      >
                        <input type="hidden" name="paymentId" value={o.paymentId} />
                        <select
                          name="status"
                          defaultValue={o.paymentStatus ?? "pending"}
                          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                        <input
                          name="transactionId"
                          defaultValue={o.paymentTransactionId ?? ""}
                          placeholder="Transaction ID"
                          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        />
                        <input
                          name="failureReason"
                          defaultValue={o.paymentFailureReason ?? ""}
                          placeholder="Failure reason"
                          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                        >
                          Save payment
                        </button>
                        <p className="text-[10px] leading-snug text-muted">
                          {(o.paymentCurrency ?? "usd").toUpperCase()} ·{" "}
                          {o.paymentProvider || "—"}
                          {o.paymentProviderSessionId
                            ? ` · ${o.paymentProviderSessionId.slice(0, 12)}…`
                            : ""}
                        </p>
                      </form>
                    ) : (
                      <span className="text-xs text-muted">No payment record</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
