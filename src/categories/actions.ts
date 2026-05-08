"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { authOptions } from "@/auth/options";
import { slugify } from "@/lib/slugify";
import { isAdmin } from "@/lib/auth/roles";

const categorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
});

export type CategoryActionState = { error?: string; ok?: boolean };

export async function createCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const slugInput = (formData.get("slug") as string | null)?.trim();
  const slug = slugInput && slugInput.length
    ? slugify(slugInput)
    : slugify(parsed.data.name);
  if (!slug) return { error: "Invalid slug" };
  await connectDB();
  try {
    await Category.create({
      name: parsed.data.name.trim(),
      slug,
      description: parsed.data.description?.trim() ?? "",
    });
  } catch {
    return { error: "Slug may already exist" };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/seller/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function updateCategory(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }
  const id = formData.get("id");
  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return { error: "Invalid category" };
  }
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const slugInput = (formData.get("slug") as string | null)?.trim();
  const slug = slugInput && slugInput.length
    ? slugify(slugInput)
    : slugify(parsed.data.name);
  if (!slug) return { error: "Invalid slug" };
  await connectDB();
  try {
    await Category.updateOne(
      { _id: id },
      {
        $set: {
          name: parsed.data.name.trim(),
          slug,
          description: parsed.data.description?.trim() ?? "",
        },
      },
    );
  } catch {
    return { error: "Could not update (slug conflict?)" };
  }
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/seller/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteCategoryFromForm(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string") {
    redirect("/admin/categories?toast=Invalid%20category&toastType=error");
  }
  const result = await deleteCategory(id);
  if (!result.ok) {
    redirect(
      `/admin/categories?toast=${encodeURIComponent(result.error ?? "Delete failed")}&toastType=error`,
    );
  }
  redirect("/admin/categories?toast=Category%20deleted&toastType=success");
}

export async function deleteCategory(
  categoryId: string,
): Promise<CategoryActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return { error: "Unauthorized" };
  }
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return { error: "Invalid id" };
  }
  await connectDB();
  const { Product } = await import("@/models/Product");
  const inUse = await Product.exists({
    categoryId: new mongoose.Types.ObjectId(categoryId),
    isActive: true,
  });
  if (inUse) {
    return { error: "Cannot delete: products still use this category" };
  }
  await Category.deleteOne({ _id: categoryId });
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/seller/products");
  revalidatePath("/products");
  return { ok: true };
}
