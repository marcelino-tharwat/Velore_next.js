import Link from "next/link";
import { listActiveBannersPublic } from "@/lib/admin/home-banners";
import { en } from "@/lib/site-copy";
import { listCategories } from "@/categories/queries";
import { listProductsFiltered } from "@/products/queries";

export const dynamic = "force-dynamic";

const PICKS_LIMIT = 8;

export default async function HomePage() {
  const [banners, allProducts, categories] = await Promise.all([
    listActiveBannersPublic(),
    listProductsFiltered({}),
    listCategories(),
  ]);
  const picks = allProducts.slice(0, PICKS_LIMIT);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-background px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            {en.home.heroBadge}
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl fade-up">
            {en.home.heroTitle}{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {en.home.heroTitleAccent}
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted fade-up">
            {en.home.heroLead}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 fade-up">
            <Link
              href="/products"
              className="btn-primary px-6"
            >
              Shop Now
            </Link>
            <Link
              href="/register"
              className="btn-secondary px-6"
            >
              {en.home.heroSecondaryCta}
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium text-muted underline-offset-4 hover:text-primary hover:underline"
            >
              {en.home.login}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="border-b border-border bg-muted-bg/30 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
          {[
            {
              title: en.home.trustShippingTitle,
              body: en.home.trustShippingBody,
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.25 2.25 0 0 0-1.227-1.054l-2.26-.501m0 0a2.25 2.25 0 0 1-1.883 2.542l-2.26.501m4.886 0h4.5" />
                </svg>
              ),
            },
            {
              title: en.home.trustSecureTitle,
              body: en.home.trustSecureBody,
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              ),
            },
            {
              title: en.home.trustSupportTitle,
              body: en.home.trustSupportBody,
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12V17.25Z" />
                </svg>
              ),
            },
          ].map((t) => (
            <div
              key={t.title}
              className="surface-card flex gap-4 p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                {t.icon}
              </span>
              <div>
                <p className="font-semibold text-foreground">{t.title}</p>
                <p className="mt-1 text-sm text-muted">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Admin banners */}
      {banners.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 fade-in">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {en.catalog.featured}
          </h2>
          <div className="mt-6 flex flex-col gap-5">
            {banners.map((b) => (
              <Link
                key={b.id}
                href={b.href}
                className="group surface-card overflow-hidden hover:border-primary/30"
              >
                {b.imageUrl ? (
                  <div className="aspect-[21/9] w-full overflow-hidden bg-muted-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="p-5 sm:p-6">
                  <p className="text-lg font-semibold text-foreground group-hover:text-primary">
                    {b.title}
                  </p>
                  {b.subtitle ? (
                    <p className="mt-1 text-sm text-muted">{b.subtitle}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-border bg-background px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Shop by category
          </h2>
          <p className="mt-2 text-sm text-muted">Discover curated collections for every need.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/products?category=${encodeURIComponent(category.slug)}`}
                  className="surface-card flex items-center justify-between p-4 hover:border-primary/30"
                >
                  <span className="font-medium text-foreground">{category.name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    Explore
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Product picks */}
      <section className="border-t border-border bg-background px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {en.home.picksTitle}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                {en.home.picksSubtitle}
              </p>
            </div>
            <Link
              href="/products"
              className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {en.home.viewProducts} →
            </Link>
          </div>

          {picks.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted">
              {en.home.emptyPicks}
            </p>
          ) : (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {picks.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="group surface-card flex h-full flex-col overflow-hidden bg-card hover:border-primary/30"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted-bg">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted">
                          {p.name}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        {p.category?.name ?? en.catalog.uncategorized}
                      </p>
                      <p className="mt-1 font-medium text-foreground group-hover:text-primary">
                        {p.name}
                      </p>
                      <p className="mt-auto pt-3 text-sm font-semibold tabular-nums text-foreground">
                        ${p.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border bg-primary px-4 py-12 text-center sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-primary-foreground">{en.home.title}</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-primary-foreground/85">{en.home.lead}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-background px-6 text-sm font-semibold text-primary transition hover:scale-[1.02]"
          >
            {en.home.viewProducts}
          </Link>
          <Link
            href="/cart"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary-foreground/40 px-6 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] hover:bg-primary-foreground/10"
          >
            {en.nav.cart}
          </Link>
        </div>
      </section>
    </div>
  );
}
