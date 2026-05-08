"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  getCartLines,
  removeCartLine,
  updateCartItemQuantity,
  type CartLine,
} from "@/cart/actions";
import { emitCartRefresh, subscribeCartRefresh } from "@/lib/cart-events";
import {
  useGuestCartStore,
  type GuestCartLine,
} from "@/stores/guest-cart-store";
import { CartSkeleton } from "@/components/ui/skeleton";
import { en } from "@/lib/site-copy";

function guestQtyCap(line: GuestCartLine): number {
  return Math.min(line.maxStock ?? 99, 99);
}

function stockCap(line: CartLine | GuestCartLine): number {
  if ("stock" in line && typeof line.stock === "number") {
    return Math.min(line.stock, 99);
  }
  return guestQtyCap(line as GuestCartLine);
}

export function CartView() {
  const { data: session, status } = useSession();
  const [memberLines, setMemberLines] = useState<CartLine[] | null>(null);
  const [pending, startTransition] = useTransition();
  const guestLines = useGuestCartStore((s) => s.lines);
  const guestRemove = useGuestCartStore((s) => s.removeLine);
  const guestSetQty = useGuestCartStore((s) => s.setQuantity);

  const isAuthed = status === "authenticated" && !!session?.user;

  const loadMemberCart = useCallback(() => {
    if (!isAuthed) {
      setMemberLines(null);
      return;
    }
    void getCartLines().then(setMemberLines);
  }, [isAuthed]);

  useEffect(() => {
    loadMemberCart();
  }, [loadMemberCart]);

  useEffect(() => {
    return subscribeCartRefresh(loadMemberCart);
  }, [loadMemberCart]);

  const lines = useMemo((): Array<CartLine | GuestCartLine> => {
    return isAuthed ? (memberLines ?? []) : guestLines;
  }, [isAuthed, memberLines, guestLines]);

  const loadingMember = isAuthed && memberLines === null;

  const total = useMemo(() => {
    return lines.reduce((s, l) => s + l.price * l.quantity, 0);
  }, [lines]);

  function adjustMemberQty(productId: string, delta: number) {
    const line = (memberLines ?? []).find((x) => x.productId === productId);
    if (!line) return;
    const next = line.quantity + delta;
    startTransition(() => {
      void (async () => {
        const r = await updateCartItemQuantity(productId, next);
        if (!r.error) {
          loadMemberCart();
          emitCartRefresh();
        }
      })();
    });
  }

  function removeMember(productId: string) {
    startTransition(() => {
      void (async () => {
        await removeCartLine(productId);
        loadMemberCart();
        emitCartRefresh();
      })();
    });
  }

  if (loadingMember) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted">
          {en.cart.loading}
        </p>
        <CartSkeleton />
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {en.cart.title}
        </h1>
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center dark:bg-muted/10">
          <p className="text-lg font-semibold text-foreground">{en.cart.empty}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{en.cart.emptyHint}</p>
          <Link
            href="/products"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90"
          >
            {en.cart.browseProducts}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 fade-in">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {en.cart.title}
      </h1>
      <ul className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
        {lines.map((l) => {
          const cap = stockCap(l);
          return (
            <li
              key={l.productId}
              className="flex flex-wrap items-center gap-4 px-4 py-5 first:rounded-t-2xl last:rounded-b-2xl sm:justify-between sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${l.slug}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  {l.name}
                </Link>
                <p className="text-sm text-muted">
                  ${l.price.toFixed(2)} {en.cart.each}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isAuthed ? (
                  <>
                    <button
                      type="button"
                      aria-label={en.cart.decreaseQty}
                      disabled={pending || l.quantity <= 1}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                      onClick={() => adjustMemberQty(l.productId, -1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={en.cart.increaseQty}
                      disabled={pending || l.quantity >= cap}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                      onClick={() => adjustMemberQty(l.productId, 1)}
                    >
                      +
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label={en.cart.decreaseQty}
                      disabled={l.quantity <= 1}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                      onClick={() =>
                        guestSetQty(l.productId, l.quantity - 1, cap)
                      }
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={en.cart.increaseQty}
                      disabled={l.quantity >= cap}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border text-sm font-medium disabled:opacity-40"
                      onClick={() =>
                        guestSetQty(l.productId, l.quantity + 1, cap)
                      }
                    >
                      +
                    </button>
                  </>
                )}
                <span className="text-sm font-medium tabular-nums">
                  ${(l.price * l.quantity).toFixed(2)}
                </span>
                <button
                  type="button"
                  className="text-sm text-red-600 underline-offset-4 hover:underline dark:text-red-400"
                  onClick={() =>
                    isAuthed
                      ? removeMember(l.productId)
                      : guestRemove(l.productId)
                  }
                  disabled={pending && isAuthed}
                >
                  {en.cart.remove}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-10 flex flex-col gap-5 border-t border-border pt-8">
        <p className="text-xl font-semibold tabular-nums text-foreground">
          {en.cart.totalLabel}: ${total.toFixed(2)}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/checkout"
            className="btn-primary w-fit px-8"
          >
            {en.cart.proceedCheckout}
          </Link>
          {!isAuthed ? (
            <p className="max-w-md text-sm leading-relaxed text-muted">
              {en.cart.guestHint}{" "}
              <Link href="/login" className="underline">
                {en.cart.signInLink}
              </Link>{" "}
              {en.cart.guestHintSuffix}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
