import Link from "next/link";
import { listCategories } from "@/categories/queries";
import { listProductsFiltered } from "@/products/queries";
import { parsePriceParam } from "@/products/filter";
import { EmptyState } from "@/components/ui/empty-state";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStockOnly?: string;
  };
}) {
  const q = searchParams.q ?? undefined;
  const category = searchParams.category ?? "all";
  const minPrice = parsePriceParam(searchParams.minPrice);
  const maxPrice = parsePriceParam(searchParams.maxPrice);
  const inStockOnly =
    searchParams.inStockOnly === "1" || searchParams.inStockOnly === "true";

  const [products, categories] = await Promise.all([
    listProductsFiltered({
      q,
      categorySlug: category === "all" ? undefined : category,
      minPrice,
      maxPrice,
        inStockOnly,
    }),
    listCategories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {en.catalog.title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        {en.catalog.intro}
      </p>

      <form
        method="get"
        className="mt-10 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card fade-up md:grid-cols-2 lg:grid-cols-5"
      >
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted lg:col-span-2">
          <span className="text-foreground">{en.catalog.searchLabel}</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={en.catalog.searchPlaceholder}
            className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          <span className="text-foreground">{en.catalog.category}</span>
          <select
            name="category"
            defaultValue={category}
            className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="all">{en.catalog.allCategories}</option>
            <option value="uncategorized">{en.catalog.uncategorized}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          <span className="text-foreground">{en.catalog.minPrice}</span>
          <input
            name="minPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={searchParams.minPrice ?? ""}
            placeholder={en.catalog.pricePlaceholder}
            className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
          <span className="text-foreground">{en.catalog.maxPrice}</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={searchParams.maxPrice ?? ""}
            className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
          <input
            name="inStockOnly"
            type="checkbox"
            value="1"
            defaultChecked={inStockOnly}
            className="h-4 w-4 rounded border-input"
          />
          In stock only
        </label>
        <div className="flex flex-wrap items-end gap-3 md:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="btn-primary px-5"
          >
            {en.catalog.apply}
          </button>
          <Link
            href="/products"
            className="btn-secondary px-5"
          >
            {en.catalog.clear}
          </Link>
        </div>
      </form>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={`/products/${p.slug}`}
              className="group surface-card flex flex-col overflow-hidden hover:border-primary/30"
            >
              <div className="aspect-video bg-muted-bg">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                  />
                ) : null}
              </div>
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {p.category?.name ?? en.catalog.uncategorized}
                </p>
                <h2 className="mt-2 text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {p.name}
                </h2>
                <p className="mt-2">
                  {p.stock > 0 ? (
                    <span className="inline-flex rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
                      Out of Stock
                    </span>
                  )}
                </p>
                <p className="mt-3 text-lg font-semibold tabular-nums text-foreground">
                  ${p.price.toFixed(2)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {products.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            title={en.catalog.noProductsTitle}
            description={`${en.catalog.noResults} ${en.catalog.noProductsHint}`}
            actionHref="/products"
            actionLabel={en.catalog.clear}
          />
        </div>
      ) : null}
    </main>
  );
}
