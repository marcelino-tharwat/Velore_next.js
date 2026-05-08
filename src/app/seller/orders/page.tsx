import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { listOrdersForSeller } from "@/lib/seller/orders";
import { sellerUpdateOrderStatus } from "@/seller/order-actions";
import { formatDateTime } from "@/lib/format-date";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order-status-label";

export const dynamic = "force-dynamic";

export default async function SellerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || normalizeRole(session.user.role) !== "seller") {
    redirect("/");
  }
  const orders = await listOrdersForSeller(session.user.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">My orders</h1>
      <p className="mt-2 text-sm text-muted">
        Orders that include your products only.
      </p>
      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No orders for your products yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Items</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Update status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 align-top">
                    <p className="font-medium">#{order.id.slice(-8)}</p>
                    <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3 align-top">{order.customerEmail}</td>
                  <td className="px-3 py-3 align-top">
                    <ul className="space-y-1">
                      {order.items.map((item) => (
                        <li key={`${order.id}-${item.productId}`}>
                          {item.name} - {item.quantity} x ${item.price.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3 align-top">{orderStatusLabel(order.status)}</td>
                  <td className="px-3 py-3 align-top">
                    {paymentStatusLabel(order.paymentStatus)}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <form action={sellerUpdateOrderStatus}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="status" value="confirmed" />
                        <button
                          type="submit"
                          className="rounded-full border border-border px-3 py-1"
                        >
                          Confirm
                        </button>
                      </form>
                      <form action={sellerUpdateOrderStatus}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="status" value="shipped" />
                        <button
                          type="submit"
                          className="rounded-full border border-border px-3 py-1"
                        >
                          Ship
                        </button>
                      </form>
                      <form action={sellerUpdateOrderStatus}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="status" value="delivered" />
                        <button
                          type="submit"
                          className="rounded-full border border-border px-3 py-1"
                        >
                          Deliver
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
