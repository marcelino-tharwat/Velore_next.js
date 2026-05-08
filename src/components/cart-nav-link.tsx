"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { subscribeCartRefresh } from "@/lib/cart-events";
import { useGuestCartStore } from "@/stores/guest-cart-store";
import { en } from "@/lib/site-copy";

async function fetchMemberItemCount(): Promise<number> {
  const res = await fetch("/api/cart", { credentials: "same-origin" });
  if (!res.ok) return 0;
  const data = (await res.json()) as { lines?: { quantity: number }[] };
  const lines = data.lines ?? [];
  return lines.reduce((s, l) => s + l.quantity, 0);
}

export function CartNavLink({ className = "" }: { className?: string }) {
  const { status } = useSession();
  const guestCount = useGuestCartStore((s) =>
    s.lines.reduce((acc, l) => acc + l.quantity, 0),
  );
  const [memberCount, setMemberCount] = useState(0);

  const refreshMember = useCallback(() => {
    if (status !== "authenticated") {
      setMemberCount(0);
      return;
    }
    void fetchMemberItemCount().then(setMemberCount);
  }, [status]);

  useEffect(() => {
    refreshMember();
  }, [refreshMember]);

  useEffect(() => {
    return subscribeCartRefresh(refreshMember);
  }, [refreshMember]);

  const count = status === "authenticated" ? memberCount : guestCount;

  return (
    <Link
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 hover:underline ${className}`}
      href="/cart"
    >
      {en.nav.cart}
      {count > 0 ? (
        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-accent-foreground">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
