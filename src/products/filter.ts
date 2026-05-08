import mongoose from "mongoose";
import { Category } from "@/models/Category";

export type ProductListFilters = {
  /** Case-insensitive substring on name */
  q?: string | null;
  categorySlug?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStockOnly?: boolean;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a MongoDB filter for active products. Resolves `categorySlug` to `categoryId`
 * or `null` for uncategorized (`slug === "uncategorized"`).
 */
export async function buildProductListFilter(
  params: ProductListFilters,
): Promise<Record<string, unknown>> {
  const filter: Record<string, unknown> = { isActive: true };
  let impossible = false;

  const q = params.q?.trim();
  if (q) {
    filter.name = { $regex: escapeRegex(q), $options: "i" };
  }

  const slug = params.categorySlug?.trim();
  if (slug && slug !== "all") {
    if (slug.toLowerCase() === "uncategorized") {
      filter.$or = [{ categoryId: null }, { categoryId: { $exists: false } }];
    } else {
      const cat = await Category.findOne({ slug: slug.toLowerCase() }).lean();
      if (!cat) {
        impossible = true;
      } else {
        filter.categoryId = cat._id;
      }
    }
  }

  const min = params.minPrice;
  const max = params.maxPrice;
  const price: { $gte?: number; $lte?: number } = {};
  if (min != null && !Number.isNaN(min) && min >= 0) {
    price.$gte = min;
  }
  if (max != null && !Number.isNaN(max) && max >= 0) {
    price.$lte = max;
  }
  if (Object.keys(price).length) {
    if (
      price.$gte != null &&
      price.$lte != null &&
      price.$gte > price.$lte
    ) {
      impossible = true;
    } else {
      filter.price = price;
    }
  }

  if (params.inStockOnly) {
    filter.stock = { $gt: 0 };
  }

  if (impossible) {
    filter._id = { $in: [] };
  }

  return filter;
}

export function parsePriceParam(
  value: string | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export function parseObjectId(
  value: string | null | undefined,
): mongoose.Types.ObjectId | null {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}
