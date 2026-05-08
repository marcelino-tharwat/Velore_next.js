import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }
  await connectDB();
  const d = parsed.data;
  const existing = await Category.findById(id).lean();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const name = d.name ?? (existing as { name: string }).name;
  const slug =
    d.slug && d.slug.trim().length ? slugify(d.slug) : slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  try {
    await Category.updateOne(
      { _id: id },
      {
        $set: {
          name: (d.name ?? existing.name).toString().trim(),
          slug,
          description:
            d.description?.trim() ??
            ((existing as { description?: string }).description ?? ""),
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Slug conflict" }, { status: 409 });
  }
  const updated = await Category.findById(id).lean();
  return NextResponse.json({
    category: updated
      ? {
          id: updated._id.toString(),
          name: updated.name,
          slug: updated.slug,
          description: updated.description ?? "",
        }
      : null,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await connectDB();
  const inUse = await Product.exists({
    categoryId: new mongoose.Types.ObjectId(id),
    isActive: true,
  });
  if (inUse) {
    return NextResponse.json(
      { error: "Category still has active products" },
      { status: 409 },
    );
  }
  await Category.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
