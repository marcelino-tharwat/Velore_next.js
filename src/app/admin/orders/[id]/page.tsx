import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getOrderForAdmin } from "@/lib/admin/orders";
import { adminOrderUpdateForm } from "@/admin/order-actions";
import { formatDateTime } from "@/lib/format-date";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();
  if (!session) return null;
  const order = await getOrderForAdmin(params.id);
  if (!order) notFound();

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm text-black/60 underline-offset-2 hover:underline dark:text-white/60"
      >
        {en.admin.orderDetailBack}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">
        {en.admin.orderDetailTitle} #{order.id.slice(-8)}
      </h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {order.customerEmail} · {formatDateTime(order.createdAt)}
      </p>

      <section className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <h2 className="text-sm font-semibold">{en.admin.orderDetailItems}</h2>
        <ul className="mt-3 divide-y divide-black/10 text-sm dark:divide-white/10">
          {order.items.map((line, i) => (
            <li key={`${line.name}-${i}`} className="flex justify-between py-2">
              <span>{line.name}</span>
              <span className="text-black/60 dark:text-white/60">
                ${line.price.toFixed(2)} × {line.quantity}
              </span>
            </li>
          ))}
        </ul>
        {order.subtotal !== undefined ? (
          <dl className="mt-4 space-y-1 border-t border-black/10 pt-4 text-sm dark:border-white/10">
            <div className="flex justify-between">
              <dt>{en.order.subtotal}</dt>
              <dd className="tabular-nums">${order.subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{en.order.discount}</dt>
              <dd className="tabular-nums">
                −${(order.discount ?? 0).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>{en.order.tax}</dt>
              <dd className="tabular-nums">${(order.tax ?? 0).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{en.order.shipping}</dt>
              <dd className="tabular-nums">${(order.shipping ?? 0).toFixed(2)}</dd>
            </div>
          </dl>
        ) : null}
        <p className="mt-4 text-lg font-semibold">
          {en.order.total}: ${order.total.toFixed(2)}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">{en.admin.orderDetailShipping}</h2>
        <form action={adminOrderUpdateForm} className="mt-4 max-w-lg space-y-4">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="flex flex-col gap-1 text-sm">
            <span>{en.admin.orderStatusLabel}</span>
            <select
              name="status"
              defaultValue={order.status}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            >
              <option value="pending">{en.orderStatus.pending}</option>
              <option value="confirmed">{en.orderStatus.confirmed}</option>
              <option value="processing">{en.orderStatus.processing}</option>
              <option value="shipped">{en.orderStatus.shipped}</option>
              <option value="delivered">{en.orderStatus.delivered}</option>
              <option value="cancelled">{en.orderStatus.cancelled}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{en.admin.trackingLabel}</span>
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
              placeholder={en.admin.trackingPlaceholder}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{en.admin.adminNotesLabel}</span>
            <textarea
              name="adminNotes"
              rows={4}
              defaultValue={order.adminNotes ?? ""}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            {en.admin.saveChanges}
          </button>
        </form>
        {order.shippedAt ? (
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">
            {en.admin.markedShipped}{" "}
            {formatDateTime(order.shippedAt)}
          </p>
        ) : null}
      </section>
    </div>
  );
}
