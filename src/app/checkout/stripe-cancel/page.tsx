import Link from "next/link";
import { en } from "@/lib/site-copy";

export default function StripeCancelPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {en.checkout.stripeCanceledTitle}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {en.checkout.stripeCanceledBody}
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/checkout"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background"
        >
          {en.checkout.backToCheckout}
        </Link>
        <Link
          href="/cart"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground"
        >
          {en.cart.title}
        </Link>
      </div>
    </main>
  );
}
