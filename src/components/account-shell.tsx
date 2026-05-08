"use client";

import { usePathname } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { en } from "@/lib/site-copy";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/account";
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr] lg:gap-12 lg:px-8">
      <aside className="lg:border-r lg:border-border lg:pr-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          {en.accountShell.asideTitle}
        </p>
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0">
          <AccountNav currentPath={pathname} />
        </div>
      </aside>
      <div className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
        {children}
      </div>
    </div>
  );
}
