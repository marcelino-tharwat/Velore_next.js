import { Skeleton } from "@/components/ui/skeleton";

export function LoadingPage({ label = "Loading…" }: { label?: string }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
        <Skeleton className="h-64 w-full max-w-3xl rounded-2xl" />
      </div>
    </main>
  );
}
