"use client";

import { signOut } from "next-auth/react";
import { en } from "@/lib/site-copy";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center rounded-lg border border-transparent px-3 text-sm font-medium text-muted transition hover:border-border hover:bg-muted-bg hover:text-foreground"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      {en.auth.signOut}
    </button>
  );
}
