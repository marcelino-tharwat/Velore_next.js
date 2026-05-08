"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CartNavLink } from "@/components/cart-nav-link";
import { SignOutButton } from "@/components/sign-out-button";
import { en } from "@/lib/site-copy";

type SiteHeaderInnerProps = {
  isSignedIn: boolean;
  email: string | null;
  showSeller: boolean;
  showAdmin: boolean;
};

export function SiteHeaderInner({
  isSignedIn,
  email,
  showSeller,
  showAdmin,
}: SiteHeaderInnerProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const linkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted-bg hover:text-primary";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md fade-in">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold tracking-tight text-primary"
        >
          {en.nav.brand}
        </Link>

        <nav
          className="hidden flex-wrap items-center gap-1 md:flex"
          aria-label="Primary"
        >
          <Link className={linkClass} href="/products">
            {en.nav.products}
          </Link>
          <CartNavLink className={linkClass} />
          {isSignedIn ? (
            <>
              <Link className={linkClass} href="/account">
                {en.nav.account}
              </Link>
              {showSeller ? (
                <Link className={linkClass} href="/seller">
                  {en.nav.seller}
                </Link>
              ) : null}
              {showAdmin ? (
                <Link className={linkClass} href="/admin">
                  {en.nav.admin}
                </Link>
              ) : null}
              {email ? (
                <span className="max-w-[10rem] truncate px-2 text-xs text-muted">
                  {email}
                </span>
              ) : null}
              <SignOutButton />
            </>
          ) : (
            <>
              <Link className={linkClass} href="/login">
                {en.nav.login}
              </Link>
              <Link
                className="btn-primary min-h-9 px-4"
                href="/register"
              >
                {en.nav.register}
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <CartNavLink className="min-h-10 border border-border bg-card font-medium hover:bg-muted-bg" />
          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted-bg"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background px-4 py-4 md:hidden fade-in"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile primary">
            <Link className={linkClass} href="/products">
              {en.nav.products}
            </Link>
            <CartNavLink className={linkClass} />
            {isSignedIn ? (
              <>
                <Link className={linkClass} href="/account">
                  {en.nav.account}
                </Link>
                {showSeller ? (
                  <Link className={linkClass} href="/seller">
                    {en.nav.seller}
                  </Link>
                ) : null}
                {showAdmin ? (
                  <Link className={linkClass} href="/admin">
                    {en.nav.admin}
                  </Link>
                ) : null}
                {email ? (
                  <p className="truncate px-3 py-2 text-xs text-muted">{email}</p>
                ) : null}
                <div className="px-3 pt-2">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <>
                <Link className={linkClass} href="/login">
                  {en.nav.login}
                </Link>
                <Link
                  className="btn-primary mx-3 mt-2 px-4"
                  href="/register"
                >
                  {en.nav.register}
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
