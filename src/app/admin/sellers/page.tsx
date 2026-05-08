import { getAdminSession } from "@/lib/admin/session";
import {
  listSellerStatsForAdmin,
  type SellerStatsRange,
} from "@/lib/admin/sellers";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format-date";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: { range?: string; q?: string };
}) {
  const session = await getAdminSession();
  if (!session) return null;

  const rangeRaw = searchParams.range ?? "all";
  const range: SellerStatsRange =
    rangeRaw === "7d" || rangeRaw === "30d" || rangeRaw === "90d"
      ? rangeRaw
      : "all";
  const q = (searchParams.q ?? "").trim();

  const sellers = await listSellerStatsForAdmin({
    limit: 250,
    range,
    search: q,
  });
  const csvHref = `/api/admin/sellers/export?range=${encodeURIComponent(range)}&q=${encodeURIComponent(q)}`;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Sellers</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Admin-only seller details and performance stats.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/sellers"
          className={`rounded-md border px-2.5 py-1 text-xs ${
            range === "all"
              ? "border-foreground bg-foreground text-background"
              : "border-border"
          }`}
        >
          All time
        </Link>
        <Link
          href={`/admin/sellers?range=7d&q=${encodeURIComponent(q)}`}
          className={`rounded-md border px-2.5 py-1 text-xs ${
            range === "7d"
              ? "border-foreground bg-foreground text-background"
              : "border-border"
          }`}
        >
          Last 7 days
        </Link>
        <Link
          href={`/admin/sellers?range=30d&q=${encodeURIComponent(q)}`}
          className={`rounded-md border px-2.5 py-1 text-xs ${
            range === "30d"
              ? "border-foreground bg-foreground text-background"
              : "border-border"
          }`}
        >
          Last 30 days
        </Link>
        <Link
          href={`/admin/sellers?range=90d&q=${encodeURIComponent(q)}`}
          className={`rounded-md border px-2.5 py-1 text-xs ${
            range === "90d"
              ? "border-foreground bg-foreground text-background"
              : "border-border"
          }`}
        >
          Last 90 days
        </Link>
      </div>
      <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
        <input type="hidden" name="range" value={range} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by seller email/store name"
          className="min-w-[260px] rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
        <button
          type="submit"
          className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
        >
          Search
        </button>
        <a
          href={csvHref}
          className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
        >
          Export CSV
        </a>
      </form>

      {sellers.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No sellers yet." />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="border-b border-border bg-muted-bg/50 dark:bg-muted-bg/10">
              <tr>
                <th className="px-3 py-3 font-medium">Seller</th>
                <th className="px-3 py-3 font-medium">Store</th>
                <th className="px-3 py-3 font-medium">Profile</th>
                <th className="px-3 py-3 font-medium">Products</th>
                <th className="px-3 py-3 font-medium">Stock</th>
                <th className="px-3 py-3 font-medium">Orders</th>
                <th className="px-3 py-3 font-medium">Units sold</th>
                <th className="px-3 py-3 font-medium">Gross revenue</th>
                <th className="px-3 py-3 font-medium">Paid revenue</th>
                <th className="px-3 py-3 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 align-top">
                    <p className="font-medium">{s.email}</p>
                    <p className="text-xs text-muted">{s.name || "—"}</p>
                    <p className="text-xs text-muted">{formatDateTime(s.createdAt)}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p>{s.sellerStoreName || "—"}</p>
                    <p className="text-xs text-muted">{s.sellerPayoutEmail || "No payout email"}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    {s.sellerProfileCompleted ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Complete
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Incomplete
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <span className="tabular-nums">{s.productCount}</span>
                    <span className="text-xs text-muted"> ({s.activeProductCount} active)</span>
                  </td>
                  <td className="px-3 py-3 align-top tabular-nums">{s.totalStock}</td>
                  <td className="px-3 py-3 align-top">
                    <span className="tabular-nums">{s.orderCount}</span>
                    <span className="text-xs text-muted"> ({s.paidOrderCount} paid)</span>
                  </td>
                  <td className="px-3 py-3 align-top tabular-nums">{s.unitsSold}</td>
                  <td className="px-3 py-3 align-top tabular-nums">
                    ${s.grossRevenue.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 align-top tabular-nums">
                    ${s.paidRevenue.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {s.banned ? <p className="text-xs text-amber-700 dark:text-amber-400">Banned</p> : null}
                    {s.deleted ? <p className="text-xs text-red-700 dark:text-red-400">Deleted</p> : null}
                    {!s.banned && !s.deleted ? <p className="text-xs text-muted">Active</p> : null}
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
