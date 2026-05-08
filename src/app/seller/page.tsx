import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { listProductsForSeller } from "@/products/queries";
import { listOrdersForSeller } from "@/lib/seller/orders";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || normalizeRole(session.user.role) !== "seller") {
    redirect("/");
  }
  const [products, paidOrders, allOrders, seller] = await Promise.all([
    listProductsForSeller(session.user.id),
    listOrdersForSeller(session.user.id, true),
    listOrdersForSeller(session.user.id, false),
    (async () => {
      await connectDB();
      return User.findById(session.user.id)
        .select("sellerPayoutEmail sellerProfileCompleted")
        .lean();
    })(),
  ]);
  const earnings = paidOrders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (lineSum, item) => lineSum + item.price * item.quantity,
        0,
      ),
    0,
  );
  const pendingPayout = allOrders
    .filter((o) => o.paymentStatus !== "paid")
    .reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (lineSum, item) => lineSum + item.price * item.quantity,
          0,
        ),
      0,
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Seller dashboard</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Manage products and inventory. Categories are created by admins.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs uppercase text-muted">My products</p>
          <p className="mt-2 text-2xl font-semibold">{products.length}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs uppercase text-muted">Paid orders</p>
          <p className="mt-2 text-2xl font-semibold">{paidOrders.length}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs uppercase text-muted">Earnings</p>
          <p className="mt-2 text-2xl font-semibold">${earnings.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border p-4 sm:col-span-3">
          <p className="text-xs uppercase text-muted">Payout management</p>
          <p className="mt-2 text-sm text-foreground">
            Payout contact:{" "}
            {(seller as { sellerPayoutEmail?: string } | null)?.sellerPayoutEmail || "Not set"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Pending payout estimate: ${pendingPayout.toFixed(2)}
          </p>
          <Link href="/account/seller" className="mt-2 inline-block text-sm underline">
            Update payout profile
          </Link>
          {!(seller as { sellerProfileCompleted?: boolean } | null)?.sellerProfileCompleted ? (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Complete seller profile to finalize payout settings.
            </p>
          ) : null}
        </div>
      </div>
      <nav className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/seller/products"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Manage products
        </Link>
        <Link
          href="/seller/products/new"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium"
        >
          Add product
        </Link>
        <Link
          href="/seller/orders"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium"
        >
          My orders
        </Link>
      </nav>
    </main>
  );
}
