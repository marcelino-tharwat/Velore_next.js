import { CartSkeleton } from "@/components/ui/skeleton";
import { en } from "@/lib/site-copy";

export default function CartLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted">
        {en.cart.loading}
      </p>
      <CartSkeleton />
    </main>
  );
}
