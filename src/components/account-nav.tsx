import Link from "next/link";
import { en } from "@/lib/site-copy";

const links = [
  { href: "/account", label: en.accountNav.profile },
  { href: "/account/payment", label: en.accountNav.payment },
  { href: "/account/seller", label: "Seller" },
  { href: "/account/reviews", label: en.accountNav.reviews },
] as const;

export function AccountNav({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex flex-row gap-1 text-sm whitespace-nowrap lg:flex-col lg:whitespace-normal">
      {links.map(({ href, label }) => {
        const active =
          href === "/account"
            ? currentPath === "/account"
            : currentPath.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2.5 transition ${
              active
                ? "border border-border bg-muted-bg font-semibold text-foreground"
                : "text-muted hover:bg-muted-bg/60 hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
