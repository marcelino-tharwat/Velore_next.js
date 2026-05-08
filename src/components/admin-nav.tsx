"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: { href: string; label: string }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/orders", label: "Orders & payments" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
];

export function AdminNav() {
  const pathname = usePathname() ?? "/admin";
  return (
    <nav className="flex flex-col gap-1 text-sm">
      {links.map((l) => {
        const active =
          l.href === "/admin"
            ? pathname === "/admin"
            : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? "border border-border bg-muted-bg font-semibold text-foreground"
                : "text-muted hover:bg-muted-bg/50 hover:text-foreground"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
