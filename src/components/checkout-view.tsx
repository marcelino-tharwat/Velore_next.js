"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState } from "react-dom";
import type { ProfileFields } from "@/account/queries";
import { submitCheckout, type CheckoutActionState } from "@/checkout/actions";
import {
  computeBreakdown,
  FREE_SHIPPING_MIN,
  TAX_RATE,
} from "@/checkout/pricing";
import type { CartLine } from "@/cart/actions";
import { emitCartRefresh } from "@/lib/cart-events";
import {
  useGuestCartStore,
  type GuestCartLine,
} from "@/stores/guest-cart-store";
import { CheckoutSkeleton } from "@/components/ui/skeleton";
import { en } from "@/lib/site-copy";

type Line = CartLine | GuestCartLine;

function lineSubtotal(lines: Line[]): number {
  return lines.reduce((s, l) => s + l.price * l.quantity, 0);
}

export function CheckoutView({
  isAuthenticated,
  memberLines,
  profile,
  accountEmail,
  defaultPaymentMethod,
}: {
  isAuthenticated: boolean;
  memberLines: CartLine[];
  profile: ProfileFields | null;
  accountEmail: string | null;
  defaultPaymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}) {
  const router = useRouter();
  const { status } = useSession();
  const guestLines = useGuestCartStore((s) => s.lines);
  const clearGuest = useGuestCartStore((s) => s.clear);
  const processedSuccess = useRef(false);

  const lines = useMemo((): Line[] => {
    return isAuthenticated ? memberLines : guestLines;
  }, [isAuthenticated, memberLines, guestLines]);

  const subtotal = useMemo(() => lineSubtotal(lines), [lines]);

  const breakdown = useMemo(() => computeBreakdown(subtotal, 0), [subtotal]);

  const [state, formAction] = useFormState<CheckoutActionState, FormData>(
    submitCheckout,
    {},
  );

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">(
    defaultPaymentMethod ? "stripe" : "cod",
  );
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && status !== "loading" && guestLines.length === 0) {
      router.replace("/cart");
    }
  }, [isAuthenticated, guestLines.length, router, status]);

  useEffect(() => {
    if (
      !state.ok ||
      !state.orderId ||
      !state.confirmationToken ||
      processedSuccess.current
    ) {
      return;
    }
    processedSuccess.current = true;
    clearGuest();
    emitCartRefresh();
    router.push(
      `/checkout/success?orderId=${encodeURIComponent(state.orderId)}&t=${encodeURIComponent(state.confirmationToken)}`,
    );
  }, [state, clearGuest, router]);

  async function startStripeCheckout() {
    const form = document.getElementById(
      "checkout-form",
    ) as HTMLFormElement | null;
    if (!form) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setStripeError(null);
    setStripeLoading(true);
    try {
      const fd = new FormData(form);
      const body: Record<string, string | undefined> = {
        email: String(fd.get("email") ?? ""),
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        addressLine1: String(fd.get("addressLine1") ?? ""),
        addressLine2: String(fd.get("addressLine2") ?? ""),
        city: String(fd.get("city") ?? ""),
        state: (fd.get("state") as string) || undefined,
        country: (fd.get("country") as string) || "EG",
        postalCode: String(fd.get("postalCode") ?? ""),
      };
      if (!isAuthenticated) {
        body.cartJson = cartJson;
      }
      const res = await fetch("/api/checkout/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Payment could not be started.");
      }
      window.location.assign(data.url);
    } catch (e) {
      setStripeError(
        e instanceof Error ? e.message : "Payment could not be started.",
      );
      setStripeLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted">
          {en.checkout.loading}
        </p>
        <CheckoutSkeleton />
      </main>
    );
  }

  if (!lines.length) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center dark:bg-muted/10">
          <p className="text-lg font-semibold text-foreground">
            {en.checkout.emptyCart}
          </p>
          <p className="mt-2 text-sm text-muted">{en.checkout.emptyCartHint}</p>
          <Link
            href="/cart"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition hover:bg-muted-bg"
          >
            {en.checkout.backToCart}
          </Link>
        </div>
      </main>
    );
  }

  const cartJson =
    !isAuthenticated && guestLines.length
      ? JSON.stringify(
          guestLines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        )
      : "[]";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/cart"
        className="text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        ← {en.checkout.backToCart}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
        {en.checkout.title}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
        {isAuthenticated
          ? en.checkout.subtitleSignedIn
          : en.checkout.subtitleGuest}
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {en.checkout.summaryTitle}
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card p-2 shadow-card sm:p-3">
            {lines.map((l) => (
              <li
                key={l.productId}
                className="flex justify-between gap-3 px-2 py-3 text-sm first:pt-2 last:pb-2"
              >
                <span>
                  <span className="font-medium">{l.name}</span>
                  <span className="text-black/55 dark:text-white/55">
                    {" "}
                    × {l.quantity}
                  </span>
                </span>
                <span className="tabular-nums">
                  ${(l.price * l.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 rounded-2xl border border-border bg-muted-bg/30 p-4 text-sm dark:bg-muted-bg/10">
            <h3 className="font-semibold text-foreground">
              {en.checkout.breakdownTitle}
            </h3>
            <div className="flex justify-between text-black/75 dark:text-white/75">
              <span>{en.checkout.subtotal}</span>
              <span className="tabular-nums">
                ${breakdown.subtotal.toFixed(2)}
              </span>
            </div>
            {breakdown.discount > 0 ? (
              <div className="flex justify-between text-green-700 dark:text-green-400">
                <span>{en.checkout.discount}</span>
                <span className="tabular-nums">
                  −${breakdown.discount.toFixed(2)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between text-black/75 dark:text-white/75">
              <span>
                {en.checkout.tax} ({(TAX_RATE * 100).toFixed(0)}%)
              </span>
              <span className="tabular-nums">${breakdown.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-black/75 dark:text-white/75">
              <span>
                {en.checkout.shipping}
                {breakdown.shipping === 0 && breakdown.taxableSubtotal > 0
                  ? ` (${en.checkout.shippingFreeHint} $${FREE_SHIPPING_MIN}+)`
                  : ""}
              </span>
              <span className="tabular-nums">
                ${breakdown.shipping.toFixed(2)}
              </span>
            </div>
            <p className="border-t border-black/10 pt-2 text-xs text-black/50 dark:border-white/10 dark:text-white/50">
              {en.checkout.shippingNote}
            </p>
            <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold dark:border-white/10">
              <span>{en.checkout.total}</span>
              <span className="tabular-nums">
                ${breakdown.total.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-3">
          <form
            id="checkout-form"
            action={formAction}
            onSubmit={(e) => {
              if (paymentMethod === "stripe") {
                e.preventDefault();
              }
            }}
            className="space-y-8 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
          >
            {!isAuthenticated ? (
              <input type="hidden" name="cartJson" value={cartJson} />
            ) : null}

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {en.checkout.contactTitle}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
                  <span>{en.checkout.email}</span>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={accountEmail ?? ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
                  <span>{en.checkout.fullName}</span>
                  <input
                    name="name"
                    required
                    defaultValue={profile?.name ?? ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>{en.checkout.phone}</span>
                  <input
                    name="phone"
                    defaultValue={profile?.phone ?? ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
                  <span>{en.checkout.address1}</span>
                  <input
                    name="addressLine1"
                    required
                    defaultValue={profile?.addressLine1 ?? ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
                  <span>{en.checkout.address2}</span>
                  <input
                    name="addressLine2"
                    defaultValue={profile?.addressLine2 ?? ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>{en.checkout.city}</span>
                  <input
                    name="city"
                    required
                    defaultValue={profile?.city ?? ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>{en.checkout.region}</span>
                  <input
                    name="state"
                    defaultValue={profile?.state || ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>{en.checkout.postal}</span>
                  <input
                    name="postalCode"
                    required
                    defaultValue={profile?.postalCode ?? ""}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>{en.checkout.country}</span>
                  <input
                    name="country"
                    required
                    defaultValue={profile?.country || "EG"}
                    className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {en.checkout.paymentTitle}
              </h2>
              <fieldset className="mt-3 space-y-3 text-sm">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-foreground/20">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">{en.checkout.codTitle}</span>
                    <span className="mt-0.5 block text-black/60 dark:text-white/60">
                      {en.checkout.codDesc}
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-foreground/20">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">{en.checkout.cardTitle}</span>
                    <span className="mt-0.5 block text-black/60 dark:text-white/60">
                      {en.checkout.cardDesc}
                    </span>
                    {defaultPaymentMethod ? (
                      <span className="mt-2 inline-flex rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
                        Saved: {defaultPaymentMethod.brand} ••••{" "}
                        {defaultPaymentMethod.last4} (exp{" "}
                        {defaultPaymentMethod.expMonth}/
                        {defaultPaymentMethod.expYear})
                      </span>
                    ) : null}
                  </span>
                </label>
              </fieldset>
            </div>

            {state.error ? (
              <p
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}

            {stripeError ? (
              <p
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {stripeError}
              </p>
            ) : null}

            {paymentMethod === "cod" ? (
              <button
                type="submit"
                className="min-h-12 w-full rounded-full bg-foreground px-8 text-sm font-semibold text-background transition hover:opacity-90 sm:w-auto"
              >
                {en.checkout.placeOrder}
              </button>
            ) : (
              <button
                type="button"
                disabled={stripeLoading}
                onClick={() => void startStripeCheckout()}
                className="min-h-12 w-full rounded-full bg-foreground px-8 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
              >
                {stripeLoading
                  ? en.checkout.stripeRedirecting
                  : en.checkout.proceedToPayment}
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
