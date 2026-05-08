import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export async function listCategories(): Promise<CategoryListItem[]> {
  await connectDB();
  const docs = await Category.find().sort({ name: 1 }).lean();
  return docs.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
  }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryListItem | null> {
  await connectDB();
  const c = await Category.findOne({ slug: slug.toLowerCase() }).lean();
  if (!c) return null;
  return {
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
  };
}
