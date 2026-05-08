import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { authOptions } from "@/auth/options";
import { isStaff, normalizeRole } from "@/lib/auth/roles";
import { getProductStaffById, getProductBySlug } from "@/products/queries";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const patchBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z
    .string()
    .refine((id) => mongoose.Types.ObjectId.isValid(id))
    .optional(),
  images: z.array(z.string().max(2000)).max(20).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const session = await getServerSession(authOptions);
  if (session?.user && isStaff(session.user.role)) {
    const role = normalizeRole(session.user.role);
    if (role === "seller") {
      await connectDB();
      const own = await Product.findOne({
        _id: id,
        sellerId: new mongoose.Types.ObjectId(session.user.id),
      })
        .select("_id")
        .lean();
      if (!own) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    const p = await getProductStaffById(id);
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product: p });
  }
  await connectDB();
  const doc = await Product.findOne({ _id: id, isActive: true })
    .select("slug")
    .lean();
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const pub = await getProductBySlug(doc.slug as string);
  return NextResponse.json({ product: pub });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }
  await connectDB();
  const existing = await Product.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const role = normalizeRole(session.user.role);
  if (
    role === "seller" &&
    (existing.sellerId as { toString(): string } | null | undefined)?.toString() !==
      session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const d = parsed.data;
  const $set: Record<string, unknown> = {};
  if (d.name != null) $set.name = d.name.trim();
  if (d.description != null) $set.description = d.description.trim();
  if (d.price != null) $set.price = d.price;
  if (d.stock != null) $set.stock = d.stock;
  if (d.isActive != null) $set.isActive = d.isActive;
  if (d.categoryId) {
    const cat = await Category.findById(d.categoryId).lean();
    if (!cat) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }
    $set.categoryId = new mongoose.Types.ObjectId(d.categoryId);
  }
  if (d.images) {
    $set.images = d.images;
    $set.imageUrl = d.images[0] ?? "";
  }
  if (d.slug != null && d.slug.trim()) {
    const slug = slugify(d.slug);
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    const dup = await Product.findOne({ slug, _id: { $ne: id } }).lean();
    if (dup) {
      return NextResponse.json({ error: "Slug in use" }, { status: 409 });
    }
    $set.slug = slug;
  }
  if (Object.keys($set).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }
  await Product.updateOne({ _id: id }, { $set });
  const updated = await getProductStaffById(id);
  return NextResponse.json({ product: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await connectDB();
  const p = await Product.findById(id).lean();
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const role = normalizeRole(session.user.role);
  if (
    role === "seller" &&
    (p.sellerId as { toString(): string } | null | undefined)?.toString() !==
      session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await Product.updateOne({ _id: id }, { $set: { isActive: false } });
  return NextResponse.json({ ok: true });
}
