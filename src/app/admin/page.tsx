import Link from "next/link";
import { getAdminStats } from "@/admin/actions";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

const dashboardLinks: { href: string; label: string; hint: string }[] = [
  { href: "/admin/users", label: en.admin.linkUsers, hint: en.admin.hintUsers },
  { href: "/admin/sellers", label: "Sellers", hint: "Seller performance" },
  {
    href: "/admin/orders",
    label: "Orders & payments",
    hint: `${en.admin.hintOrders} View and edit payment records in the same table.`,
  },
  {
    href: "/admin/categories",
    label: en.admin.linkCategories,
    hint: en.admin.hintCategories,
  },
  {
    href: "/admin/products",
    label: en.admin.linkProducts,
    hint: en.admin.hintProducts,
  },
];

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold">{en.admin.dashboardTitle}</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {en.admin.dashboardIntro}
      </p>

      {stats ? (
        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              {en.admin.statUsers}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {stats.users}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              {en.admin.statProducts}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {stats.products}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              {en.admin.statCategories}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {stats.categories}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              {en.admin.statOrders}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {stats.orders}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
              {en.admin.pendingRevenue}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              ${stats.revenuePending.toFixed(2)}
            </dd>
          </div>
        </dl>
      ) : null}

      <nav className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-foreground/15 hover:shadow-card-md"
          >
            <p className="font-semibold text-foreground">{l.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{l.hint}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
