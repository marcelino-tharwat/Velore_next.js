import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import { listCategories } from "@/categories/queries";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { parsePriceParam } from "@/products/filter";
import { listProductsFiltered } from "@/products/queries";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? searchParams.get("search");
    const category = searchParams.get("category");
    const minPrice = parsePriceParam(
      searchParams.get("minPrice") ?? searchParams.get("min"),
    );
    const maxPrice = parsePriceParam(
      searchParams.get("maxPrice") ?? searchParams.get("max"),
    );
    const inStockOnlyRaw =
      searchParams.get("inStockOnly") ?? searchParams.get("stock");
    const inStockOnly =
      inStockOnlyRaw === "1" ||
      inStockOnlyRaw?.toLowerCase() === "true" ||
      inStockOnlyRaw?.toLowerCase() === "in_stock";
    const [products, categories] = await Promise.all([
      listProductsFiltered({
        q,
        categorySlug: category,
        minPrice,
        maxPrice,
        inStockOnly,
      }),
      listCategories(),
    ]);
    return NextResponse.json({ products, categories });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const postBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  categoryId: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
  images: z.array(z.string().max(2000)).max(20).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || normalizeRole(session.user.role) !== "seller") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const slug =
    d.slug && d.slug.trim().length
      ? slugify(d.slug)
      : slugify(d.name);
  if (!slugRegex.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  await connectDB();
  const cat = await Category.findById(d.categoryId).lean();
  if (!cat) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }
  const images = d.images?.length ? d.images : [];
  try {
    await Product.create({
      name: d.name.trim(),
      slug,
      description: d.description?.trim() ?? "",
      price: d.price,
      stock: d.stock,
      images,
      imageUrl: images[0] ?? "",
      categoryId: new mongoose.Types.ObjectId(d.categoryId),
      sellerId: new mongoose.Types.ObjectId(session.user.id),
      isActive: true,
    });
  } catch {
    return NextResponse.json({ error: "Duplicate slug?" }, { status: 409 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
