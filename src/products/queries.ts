import mongoose from "mongoose";
import { getProductRatingStats } from "@/account/queries";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import type { ProductListFilters } from "@/products/filter";
import { buildProductListFilter } from "@/products/filter";
import { getProductImages, primaryImage } from "@/products/images";

export type ProductCategorySummary = {
  id: string;
  name: string;
  slug: string;
} | null;

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  /** All image URLs */
  images: string[];
  /** First image (legacy field name for cart/wishlist) */
  imageUrl: string;
  stock: number;
  category: ProductCategorySummary;
};

function mapCategory(
  raw: unknown,
): ProductCategorySummary {
  if (
    raw &&
    typeof raw === "object" &&
    "_id" in raw &&
    "name" in raw &&
    "slug" in raw
  ) {
    const c = raw as { _id: { toString(): string }; name: string; slug: string };
    return {
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
    };
  }
  return null;
}

function mapProductDoc(p: {
  _id: { toString(): string };
  name: string;
  slug: string;
  description?: string;
  price: number;
  images?: string[];
  imageUrl?: string;
  stock: number;
  categoryId?: unknown;
}): ProductListItem {
  const images = getProductImages(p);
  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    price: p.price,
    images,
    imageUrl: primaryImage(p),
    stock: p.stock,
    category: mapCategory(p.categoryId),
  };
}

export async function listProductsFiltered(
  filters: ProductListFilters,
): Promise<ProductListItem[]> {
  await connectDB();
  const mongoFilter = await buildProductListFilter(filters);
  const docs = await Product.find(mongoFilter)
    .populate("categoryId", "name slug")
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((p) =>
    mapProductDoc(
      p as Parameters<typeof mapProductDoc>[0],
    ),
  );
}

/** @deprecated use listProductsFiltered */
export async function getActiveProducts(): Promise<ProductListItem[]> {
  return listProductsFiltered({});
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductListItem | null> {
  await connectDB();
  const p = await Product.findOne({ slug, isActive: true })
    .populate("categoryId", "name slug")
    .lean();
  if (!p) return null;
  return mapProductDoc(p as Parameters<typeof mapProductDoc>[0]);
}

export type ProductDetail = ProductListItem & {
  avgRating: number | null;
  reviewCount: number;
};

export async function getProductDetailBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const base = await getProductBySlug(slug);
  if (!base) return null;
  const stats = await getProductRatingStats(base.id);
  return {
    ...base,
    avgRating: stats.avg,
    reviewCount: stats.count,
  };
}

export type ProductStaffItem = ProductListItem & {
  isActive: boolean;
  sellerId?: string;
};

export async function getProductStaffById(
  id: string,
): Promise<ProductStaffItem | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const p = await Product.findById(id)
    .populate("categoryId", "name slug")
    .lean();
  if (!p) return null;
  const base = mapProductDoc(p as Parameters<typeof mapProductDoc>[0]);
  return {
    ...base,
    isActive: Boolean((p as { isActive?: boolean }).isActive),
    sellerId:
      (p as { sellerId?: { toString(): string } | null }).sellerId?.toString() ??
      undefined,
  };
}

export async function listProductsStaff(): Promise<ProductStaffItem[]> {
  await connectDB();
  const docs = await Product.find()
    .populate("categoryId", "name slug")
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map((p) => ({
    ...mapProductDoc(p as Parameters<typeof mapProductDoc>[0]),
    isActive: Boolean((p as { isActive?: boolean }).isActive),
    sellerId:
      (p as { sellerId?: { toString(): string } | null }).sellerId?.toString() ??
      undefined,
  }));
}

export async function listProductsForSeller(
  sellerId: string,
): Promise<ProductStaffItem[]> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(sellerId)) return [];
  const docs = await Product.find({
    sellerId: new mongoose.Types.ObjectId(sellerId),
  })
    .populate("categoryId", "name slug")
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map((p) => ({
    ...mapProductDoc(p as Parameters<typeof mapProductDoc>[0]),
    isActive: Boolean((p as { isActive?: boolean }).isActive),
    sellerId:
      (p as { sellerId?: { toString(): string } | null }).sellerId?.toString() ??
      undefined,
  }));
}
