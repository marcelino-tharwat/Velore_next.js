"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { CartSync } from "@/components/cart-sync";
import { RouteToast } from "@/components/ui/route-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartSync />
      <Suspense fallback={null}>
        <RouteToast />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
