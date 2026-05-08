import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getReviewEligibility, listReviewsForProduct } from "@/account/queries";
import { getProductDetailBySlug } from "@/products/queries";
import { authOptions } from "@/auth/options";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { ReviewForm } from "@/components/review-form";
import { formatDate } from "@/lib/format-date";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductDetailBySlug(params.slug);
  if (!product) notFound();
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;
  const reviews = await listReviewsForProduct(product.id);
  let reviewUi: { canReview: boolean; alreadyReviewed: boolean } = {
    canReview: false,
    alreadyReviewed: false,
  };
  if (session?.user?.id) {
    reviewUi = await getReviewEligibility(session.user.id, product.id);
  }

  const reviewWord =
    product.reviewCount === 1 ? en.productDetail.reviewWord : en.productDetail.reviewsWord;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/products"
        className="text-sm text-black/60 underline-offset-4 hover:underline dark:text-white/60"
      >
        {en.productDetail.backToCatalog}
      </Link>
      <article className="mt-6">
        <p className="text-sm text-black/55 dark:text-white/55">
          {product.category ? (
            <>
              <Link
                className="underline-offset-2 hover:underline"
                href={`/products?category=${encodeURIComponent(product.category.slug)}`}
              >
                {product.category.name}
              </Link>
            </>
          ) : (
            <Link
              className="underline-offset-2 hover:underline"
              href="/products?category=uncategorized"
            >
              {en.catalog.uncategorized}
            </Link>
          )}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>
        {product.images.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {product.images.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="aspect-square overflow-hidden rounded-lg bg-black/5 dark:bg-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
        <p className="mt-4 text-black/80 dark:text-white/80">
          {product.description || en.productDetail.noDescription}
        </p>
        <p className="mt-6 text-xl font-semibold">${product.price.toFixed(2)}</p>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {product.stock} {en.productDetail.inStock}
          {product.reviewCount > 0 ? (
            <>
              {" "}
              · {product.avgRating?.toFixed(1)}★ {en.productDetail.ratingFrom}{" "}
              {product.reviewCount} {reviewWord}
            </>
          ) : (
            <> · {en.productDetail.noReviewsLine}</>
          )}
        </p>
        <div className="mt-8 space-y-3">
          {product.stock === 0 ? (
            <p className="text-sm text-black/60 dark:text-white/60">
              {en.productDetail.outOfStock}
            </p>
          ) : (
            <AddToCartForm
              snapshot={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                imageUrl: product.imageUrl,
                stock: product.stock,
              }}
            />
          )}
          {!signedIn ? (
            <p className="text-sm text-black/60 dark:text-white/60">
              <Link className="underline" href="/login">
                {en.nav.login}
              </Link>{" "}
              {en.productDetail.loginAfterLink}
            </p>
          ) : null}
        </div>
      </article>

      <section className="mt-14 border-t border-black/10 pt-10 dark:border-white/10">
        <h2 className="text-lg font-semibold">{en.productDetail.reviewsTitle}</h2>
        <ul className="mt-4 space-y-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{r.authorDisplay}</span>
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
              {r.comment ? (
                <p className="mt-1 text-sm text-black/75 dark:text-white/75">
                  {r.comment}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                {formatDate(r.createdAt)}
              </p>
            </li>
          ))}
        </ul>

        {signedIn && reviewUi.canReview ? (
          <div className="mt-8 rounded-lg border border-black/10 p-4 dark:border-white/10">
            <h3 className="text-sm font-medium">{en.productDetail.writeReviewTitle}</h3>
            <p className="mt-1 text-xs text-black/55 dark:text-white/55">
              {en.productDetail.writeReviewHint}
            </p>
            <ReviewForm productId={product.id} />
          </div>
        ) : null}
        {signedIn && reviewUi.alreadyReviewed ? (
          <p className="mt-4 text-sm text-black/60 dark:text-white/60">
            {en.productDetail.alreadyReviewed}
          </p>
        ) : null}
        {signedIn && !reviewUi.canReview && !reviewUi.alreadyReviewed ? (
          <p className="mt-4 text-sm text-black/60 dark:text-white/60">
            {en.productDetail.purchaseToReview}
          </p>
        ) : null}
      </section>
    </main>
  );
}
