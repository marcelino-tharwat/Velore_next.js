import { connectDB } from "@/lib/db/mongoose";
import { Role } from "@/models/Role";

/** Core slugs aligned with previous `User.role` enum; seeded on first use. */
const DEFAULT_ROLE_SEEDS: { slug: string; name: string }[] = [
  { slug: "customer", name: "Customer" },
  { slug: "seller", name: "Seller" },
  { slug: "admin", name: "Admin" },
  { slug: "user", name: "User (legacy)" },
];

export function slugifyRoleName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function ensureDefaultRoles(): Promise<void> {
  await connectDB();
  for (const seed of DEFAULT_ROLE_SEEDS) {
    await Role.updateOne(
      { slug: seed.slug },
      { $setOnInsert: { name: seed.name, slug: seed.slug } },
      { upsert: true },
    );
  }
}

export async function listRoles(): Promise<{ slug: string; name: string }[]> {
  await ensureDefaultRoles();
  const docs = await Role.find().sort({ name: 1 }).lean();
  return docs.map((d) => ({
    slug: d.slug as string,
    name: d.name as string,
  }));
}

export async function roleSlugExists(slug: string): Promise<boolean> {
  await ensureDefaultRoles();
  const n = await Role.countDocuments({ slug: slug.trim().toLowerCase() });
  return n > 0;
}

export async function createRoleByName(
  name: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name is required." };
  if (trimmed.length > 120) {
    return { ok: false, error: "Name is too long." };
  }
  const slug = slugifyRoleName(trimmed);
  if (!slug) {
    return { ok: false, error: "Could not derive a valid role slug from the name." };
  }
  await ensureDefaultRoles();
  await connectDB();
  try {
    await Role.create({ name: trimmed, slug });
    return { ok: true, slug };
  } catch {
    return { ok: false, error: "A role with this name or slug already exists." };
  }
}
