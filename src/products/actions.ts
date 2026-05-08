"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { authOptions } from "@/auth/options";
import { isStaff, normalizeRole } from "@/lib/auth/roles";
import { slugify } from "@/lib/slugify";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseImagesFromForm(formData: FormData, key = "images"): string[] {
  const raw = formData.get(key);
  if (typeof raw !== "string") return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

const productBaseSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(slugRegex, "Slug must be lowercase URL-safe"),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  categoryId: z
    .string()
    .min(1)
    .refine((id) => mongoose.Types.ObjectId.isValid(id), "Invalid category"),
});

export type ProductActionState = { error?: string; ok?: boolean };

export async function createProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaff(session.user.role)) {
    return { error: "Unauthorized" };
  }
  const slugManual = (formData.get("slug") as string | null)?.trim();
  const name = (formData.get("name") as string) ?? "";
  const slug =
    slugManual && slugManual.length ? slugify(slugManual) : slugify(name);
  if (!slugRegex.test(slug)) {
    return { error: "Invalid slug" };
  }
  const parsed = productBaseSchema.safeParse({
    name: formData.get("name"),
    slug,
    description: formData.get("description") || "",
    price: formData.get("price"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const images = parseImagesFromForm(formData);
  const data = parsed.data;
  await connectDB();
  const cat = await Category.findById(data.categoryId).lean();
  if (!cat) return { error: "Category not found" };
  try {
    const role = normalizeRole(session.user.role);
    await Product.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? "",
      price: data.price,
      stock: data.stock,
      images,
      imageUrl: images[0] ?? "",
      categoryId: new mongoose.Types.ObjectId(data.categoryId),
      ...(role === "seller"
        ? { sellerId: new mongoose.Types.ObjectId(session.user.id) }
        : {}),
      isActive: true,
    });
  } catch {
    return { error: "Could not create product (duplicate slug?)" };
  }
  revalidatePathsForProducts();
  return { ok: true };
}

export async function updateProduct(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaff(session.user.role)) {
    return { error: "Unauthorized" };
  }
  const id = formData.get("id");
  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return { error: "Invalid product" };
  }
  const slugManual = (formData.get("slug") as string | null)?.trim();
  const name = (formData.get("name") as string) ?? "";
  const slug =
    slugManual && slugManual.length ? slugify(slugManual) : slugify(name);
  if (!slugRegex.test(slug)) {
    return { error: "Invalid slug" };
  }
  const parsed = productBaseSchema.safeParse({
    name: formData.get("name"),
    slug,
    description: formData.get("description") || "",
    price: formData.get("price"),
    stock: formData.get("stock"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const images = parseImagesFromForm(formData);
  const data = parsed.data;
  await connectDB();
  const existing = await Product.findById(id).lean();
  if (!existing) return { error: "Product not found" };
  const role = normalizeRole(session.user.role);
  if (
    role === "seller" &&
    (existing.sellerId as { toString(): string } | null | undefined)?.toString() !==
      session.user.id
  ) {
    return { error: "Forbidden" };
  }
  const cat = await Category.findById(data.categoryId).lean();
  if (!cat) return { error: "Category not found" };
  const dup = await Product.findOne({
    slug: data.slug,
    _id: { $ne: id },
  }).lean();
  if (dup) return { error: "Another product already uses this slug" };
  await Product.updateOne(
    { _id: id },
    {
      $set: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        price: data.price,
        stock: data.stock,
        images,
        imageUrl: images[0] ?? "",
        categoryId: new mongoose.Types.ObjectId(data.categoryId),
      },
    },
  );
  revalidatePathsForProducts(String(existing.slug), data.slug);
  return { ok: true };
}

export async function softDeleteProductFromForm(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin/products");
  if (typeof id !== "string") {
    redirect(
      `${redirectTo}?toast=${encodeURIComponent("Invalid product")}&toastType=error`,
    );
  }
  const result = await softDeleteProduct(id);
  if (!result.ok) {
    redirect(
      `${redirectTo}?toast=${encodeURIComponent(result.error ?? "Product update failed")}&toastType=error`,
    );
  }
  redirect(
    `${redirectTo}?toast=${encodeURIComponent("Product deactivated")}&toastType=success`,
  );
}

export async function softDeleteProduct(
  productId: string,
): Promise<ProductActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaff(session.user.role)) {
    return { error: "Unauthorized" };
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { error: "Invalid id" };
  }
  await connectDB();
  const p = await Product.findById(productId).lean();
  if (!p) return { error: "Not found" };
  const role = normalizeRole(session.user.role);
  if (
    role === "seller" &&
    (p.sellerId as { toString(): string } | null | undefined)?.toString() !==
      session.user.id
  ) {
    return { error: "Forbidden" };
  }
  await Product.updateOne({ _id: productId }, { $set: { isActive: false } });
  revalidatePathsForProducts(p.slug as string);
  return { ok: true };
}

function revalidatePathsForProducts(oldSlug?: string, newSlug?: string) {
  revalidatePath("/products");
  revalidatePath("/api/products");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/seller");
  revalidatePath("/seller/products");
  if (oldSlug) revalidatePath(`/products/${oldSlug}`);
  if (newSlug && newSlug !== oldSlug) revalidatePath(`/products/${newSlug}`);
}
