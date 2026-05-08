import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { listMyReviews } from "@/account/queries";
import { authOptions } from "@/auth/options";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format-date";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/reviews");
  const reviews = await listMyReviews(session.user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{en.account.reviewsTitle}</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {en.account.reviewsIntro}
      </p>
      {reviews.length === 0 ? (
        <div className="mt-10">
          <EmptyState title={en.account.reviewsEmpty} />
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/products/${r.productSlug}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {r.productName}
                </Link>
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              {r.title ? (
                <p className="mt-2 font-medium text-foreground">{r.title}</p>
              ) : null}
              {r.comment ? (
                <p className="mt-1 text-sm text-muted">{r.comment}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted">{formatDate(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
