export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted-bg ${className}`}
      {...props}
    />
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading cart">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3 border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading checkout">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-3 lg:col-span-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul
      className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full max-w-[12rem]" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
