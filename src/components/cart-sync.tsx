"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { mergeGuestCartToServer } from "@/cart/actions";
import { emitCartRefresh } from "@/lib/cart-events";
import { useGuestCartStore } from "@/stores/guest-cart-store";

/**
 * When a session becomes available, merges persisted guest lines into the DB cart once.
 */
export function CartSync() {
  const { data: session, status } = useSession();
  const inFlight = useRef<Promise<unknown> | null>(null);
  /** Re-run merge after zustand rehydrates guest lines from localStorage. */
  const guestSignature = useGuestCartStore((s) =>
    s.lines.map((l) => `${l.productId}:${l.quantity}`).join("|"),
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    if (inFlight.current) return;
    const lines = useGuestCartStore.getState().lines;
    if (!lines.length) return;
    const payload = lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }));
    const promise = mergeGuestCartToServer(payload)
      .then((res) => {
        if (res.ok) {
          useGuestCartStore.getState().clear();
          emitCartRefresh();
        }
      })
      .finally(() => {
        inFlight.current = null;
      });
    inFlight.current = promise;
  }, [status, session?.user?.id, guestSignature]);

  return null;
}
