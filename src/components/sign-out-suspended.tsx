"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/** Clears session cookie when account was banned or soft-deleted. */
export function SignOutSuspended({ active }: { active: boolean }) {
  useEffect(() => {
    if (active) {
      void signOut({ callbackUrl: "/login" });
    }
  }, [active]);
  return null;
}
