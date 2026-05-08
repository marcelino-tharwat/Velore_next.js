"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ToastKind = "success" | "error";

export function RouteToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null);

  useEffect(() => {
    const msg = searchParams.get("toast");
    const kindRaw = searchParams.get("toastType");
    if (!msg) return;
    const kind: ToastKind = kindRaw === "error" ? "error" : "success";
    setToast({ msg, kind });

    const next = new URLSearchParams(searchParams.toString());
    next.delete("toast");
    next.delete("toastType");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-[110] max-w-sm rounded-md px-4 py-2 text-sm shadow-lg ${
        toast.kind === "success"
          ? "bg-emerald-700 text-white"
          : "bg-red-700 text-white"
      }`}
    >
      {toast.msg}
    </div>
  );
}
