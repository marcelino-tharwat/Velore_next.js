import { CheckoutSkeleton } from "@/components/ui/skeleton";
import { en } from "@/lib/site-copy";

export default function CheckoutLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted">
        {en.checkout.loading}
      </p>
      <CheckoutSkeleton />
    </main>
  );
}
