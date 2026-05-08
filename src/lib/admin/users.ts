import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { isMockEmailVerification } from "@/lib/auth/email-verification-env";
import { normalizeRole } from "@/lib/auth/roles";
import { Cart } from "@/models/Cart";
import { User } from "@/models/User";
import { ensureDefaultRoles, roleSlugExists } from "@/lib/admin/roles";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  bannedAt: string | null;
  deletedAt: string | null;
};

export async function listUsersForAdmin(opts: {
  search?: string;
  includeDeleted?: boolean;
  limit?: number;
  skip?: number;
}): Promise<AdminUserRow[]> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (!opts.includeDeleted) {
    filter.deletedAt = null;
  }
  if (opts.search?.trim()) {
    const q = opts.search.trim();
    filter.$or = [
      { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }
  const docs = await User.find(filter)
    .select("email name role createdAt bannedAt deletedAt")
    .sort({ createdAt: -1 })
    .skip(opts.skip ?? 0)
    .limit(Math.min(opts.limit ?? 50, 100))
    .lean();
  return docs.map((u) => ({
    id: u._id.toString(),
    email: u.email,
    name: u.name ?? "",
    role: u.role ?? "customer",
    createdAt: (u.createdAt as Date).toISOString(),
    bannedAt: u.bannedAt ? (u.bannedAt as Date).toISOString() : null,
    deletedAt: u.deletedAt ? (u.deletedAt as Date).toISOString() : null,
  }));
}

async function countOtherActiveAdmins(excludeId: string): Promise<number> {
  return User.countDocuments({
    _id: { $ne: new mongoose.Types.ObjectId(excludeId) },
    role: "admin",
    deletedAt: null,
    bannedAt: null,
  });
}

export async function setUserBanState(
  userId: string,
  banned: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { ok: false, error: "Invalid user id" };
  }
  await connectDB();
  const u = await User.findById(userId).lean();
  if (!u) return { ok: false, error: "User not found" };
  if (normalizeRole(u.role as string) === "admin" && banned) {
    const others = await countOtherActiveAdmins(userId);
    if (others < 1) {
      return { ok: false, error: "Cannot ban the only active admin" };
    }
  }
  await User.updateOne(
    { _id: userId },
    { $set: { bannedAt: banned ? new Date() : null } },
  );
  return { ok: true };
}

export async function setUserSoftDelete(
  userId: string,
  deleted: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { ok: false, error: "Invalid user id" };
  }
  await connectDB();
  const u = await User.findById(userId).lean();
  if (!u) return { ok: false, error: "User not found" };
  if (normalizeRole(u.role as string) === "admin" && deleted) {
    const others = await countOtherActiveAdmins(userId);
    if (others < 1) {
      return { ok: false, error: "Cannot delete the only active admin" };
    }
  }
  await User.updateOne(
    { _id: userId },
    { $set: { deletedAt: deleted ? new Date() : null } },
  );
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  newRole: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { ok: false, error: "Invalid user id" };
  }
  const slug = newRole.trim().toLowerCase();
  if (!slug || slug.length > 64) {
    return { ok: false, error: "Invalid role" };
  }
  await ensureDefaultRoles();
  const exists = await roleSlugExists(slug);
  if (!exists) {
    return { ok: false, error: "Unknown role" };
  }
  await connectDB();
  const u = await User.findById(userId).lean();
  if (!u) return { ok: false, error: "User not found" };
  const current = (u.role as string) ?? "customer";
  if (current === slug) return { ok: true };
  const wasAdmin = normalizeRole(current) === "admin";
  const willBeAdmin = slug === "admin";
  if (wasAdmin && !willBeAdmin) {
    const others = await countOtherActiveAdmins(userId);
    if (others < 1) {
      return { ok: false, error: "Cannot demote the only active admin" };
    }
  }
  await User.updateOne({ _id: userId }, { $set: { role: slug } });
  return { ok: true };
}

const adminCreateUserSchema = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
  role: z.string().min(1).max(64),
});

export async function createUserByAdmin(
  body: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = adminCreateUserSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Invalid input" };
  }
  const { email, password, name, role: roleRaw } = parsed.data;
  const role = roleRaw.trim().toLowerCase();
  await ensureDefaultRoles();
  if (!(await roleSlugExists(role))) {
    return { ok: false, error: "Unknown role" };
  }
  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const mockVerify = isMockEmailVerification();
  const verificationToken = mockVerify
    ? undefined
    : randomBytes(32).toString("hex");
  const verificationTokenExpires = mockVerify
    ? undefined
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    email,
    passwordHash,
    name: name?.trim() ?? "",
    role,
    emailVerified: mockVerify ? new Date() : null,
    verificationToken,
    verificationTokenExpires,
  });

  try {
    await Cart.create({ userId: user._id, items: [] });
  } catch {
    /* cart may already exist */
  }

  return { ok: true };
}
