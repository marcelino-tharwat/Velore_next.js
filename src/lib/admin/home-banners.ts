import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { HomeBanner } from "@/models/HomeBanner";

export type AdminBannerRow = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  sortOrder: number;
  active: boolean;
};

export async function listBannersForAdmin(): Promise<AdminBannerRow[]> {
  await connectDB();
  const docs = await HomeBanner.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
  return docs.map((b) => ({
    id: b._id.toString(),
    title: b.title,
    subtitle: b.subtitle ?? "",
    imageUrl: b.imageUrl ?? "",
    href: b.href ?? "/products",
    sortOrder: b.sortOrder ?? 0,
    active: b.active ?? true,
  }));
}

export async function listActiveBannersPublic(): Promise<AdminBannerRow[]> {
  await connectDB();
  const docs = await HomeBanner.find({ active: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();
  return docs.map((b) => ({
    id: b._id.toString(),
    title: b.title,
    subtitle: b.subtitle ?? "",
    imageUrl: b.imageUrl ?? "",
    href: b.href ?? "/products",
    sortOrder: b.sortOrder ?? 0,
    active: true,
  }));
}

export async function createBanner(input: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
  sortOrder?: number;
  active?: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await connectDB();
  if (!input.title?.trim()) return { ok: false, error: "Title required" };
  const doc = await HomeBanner.create({
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() ?? "",
    imageUrl: input.imageUrl?.trim() ?? "",
    href: input.href?.trim() || "/products",
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  });
  return { ok: true, id: doc._id.toString() };
}

export async function updateBanner(
  id: string,
  patch: Partial<{
    title: string;
    subtitle: string;
    imageUrl: string;
    href: string;
    sortOrder: number;
    active: boolean;
  }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { ok: false, error: "Invalid id" };
  }
  await connectDB();
  const doc = await HomeBanner.findById(id);
  if (!doc) return { ok: false, error: "Not found" };
  if (patch.title !== undefined) doc.title = patch.title.trim();
  if (patch.subtitle !== undefined) doc.subtitle = patch.subtitle;
  if (patch.imageUrl !== undefined) doc.imageUrl = patch.imageUrl;
  if (patch.href !== undefined) doc.href = patch.href || "/products";
  if (patch.sortOrder !== undefined) doc.sortOrder = patch.sortOrder;
  if (patch.active !== undefined) doc.active = patch.active;
  await doc.save();
  return { ok: true };
}

export async function deleteBanner(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { ok: false, error: "Invalid id" };
  }
  await connectDB();
  const r = await HomeBanner.deleteOne({ _id: id });
  if (r.deletedCount === 0) return { ok: false, error: "Not found" };
  return { ok: true };
}
