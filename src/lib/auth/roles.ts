import type { UserRole } from "@/models/User";

const LEGACY_USER = "user" as const;

export function normalizeRole(role: string | undefined): "customer" | "seller" | "admin" {
  if (role === "seller" || role === "admin") return role;
  if (role === LEGACY_USER || role === "customer" || !role) return "customer";
  return "customer";
}

export function isStaff(role: string | undefined): boolean {
  const r = normalizeRole(role);
  return r === "seller" || r === "admin";
}

/** Seller storefront navigation — admins use Admin only, not this shortcut */
export function isSeller(role: string | undefined): boolean {
  return normalizeRole(role) === "seller";
}

export function isAdmin(role: string | undefined): boolean {
  return normalizeRole(role) === "admin";
}

export type { UserRole };
