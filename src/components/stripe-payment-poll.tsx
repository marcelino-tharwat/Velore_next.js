"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { en } from "@/lib/site-copy";
import { emitCartRefresh } from "@/lib/cart-events";
import { useGuestCartStore } from "@/stores/guest-cart-store";

export function StripePaymentPoll({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const clearGuest = useGuestCartStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await fetch(
          `/api/checkout/order-by-session?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: "same-origin" },
        );
        const data = (await res.json()) as {
          pending?: boolean;
          orderId?: string;
          confirmationToken?: string;
        };
        if (!data.pending && data.orderId && data.confirmationToken !== undefined) {
          clearGuest();
          emitCartRefresh();
          router.replace(
            `/checkout/success?orderId=${encodeURIComponent(data.orderId)}&t=${encodeURIComponent(data.confirmationToken)}`,
          );
          return;
        }
      } catch {
        /* retry */
      }
      if (attempts >= maxAttempts) {
        router.replace("/checkout?payment=pending");
        return;
      }
      window.setTimeout(tick, 1500);
    };

    const id = window.setTimeout(tick, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [sessionId, router, clearGuest]);

  return (
    <p className="mt-6 text-sm text-muted" role="status">
      {en.checkout.stripePollingNote}
    </p>
  );
}
