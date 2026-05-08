import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { en } from "@/lib/site-copy";

export default function ProductsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-48 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl rounded-lg" />
      <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Skeleton className="h-16 w-full rounded-lg lg:col-span-2" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
      <p className="mb-4 mt-10 text-xs font-semibold uppercase tracking-wider text-muted">
        {en.catalog.title}
      </p>
      <ProductGridSkeleton count={6} />
    </main>
  );
}
