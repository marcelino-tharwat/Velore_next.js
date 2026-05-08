import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { PaymentMethod } from "@/models/PaymentMethod";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";
import { User } from "@/models/User";

export type ProfileFields = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export async function getProfileFields(userId: string): Promise<ProfileFields | null> {
  await connectDB();
  const u = await User.findById(userId).lean();
  if (!u) return null;
  return {
    name: u.name ?? "",
    phone: u.phone ?? "",
    addressLine1: u.addressLine1 ?? "",
    addressLine2: u.addressLine2 ?? "",
    city: u.city ?? "",
    state: u.state ?? "",
    postalCode: u.postalCode ?? "",
    country: u.country ?? "",
  };
}

export type PaymentRow = {
  id: string;
  label: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export async function listPaymentMethods(userId: string): Promise<PaymentRow[]> {
  await connectDB();
  const list = await PaymentMethod.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return list.map((m) => ({
    id: m._id.toString(),
    label: m.label,
    brand: m.brand,
    last4: m.last4,
    expMonth: m.expMonth,
    expYear: m.expYear,
    isDefault: m.isDefault,
  }));
}

export type ReviewListItem = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  authorDisplay: string;
  createdAt: string;
};

export async function listReviewsForProduct(
  productId: string,
  limit = 50,
): Promise<ReviewListItem[]> {
  await connectDB();
  const docs = await Review.find({ productId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((r) => ({
    id: r._id.toString(),
    rating: r.rating,
    title: r.title ?? "",
    comment: r.comment ?? "",
    authorDisplay: r.authorDisplay,
    createdAt: (r.createdAt as Date).toISOString(),
  }));
}

export async function getProductRatingStats(productId: string): Promise<{
  avg: number | null;
  count: number;
}> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { avg: null, count: 0 };
  }
  await connectDB();
  const oid = new mongoose.Types.ObjectId(productId);
  const agg = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { productId: oid } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  if (!agg.length) return { avg: null, count: 0 };
  return { avg: Math.round(agg[0].avg * 10) / 10, count: agg[0].count };
}

export type MyReviewRow = ReviewListItem & {
  productName: string;
  productSlug: string;
};

export async function getReviewEligibility(
  userId: string,
  productId: string,
): Promise<{ canReview: boolean; alreadyReviewed: boolean }> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { canReview: false, alreadyReviewed: false };
  }
  await connectDB();
  const uid = new mongoose.Types.ObjectId(userId);
  const pid = new mongoose.Types.ObjectId(productId);
  const reviewed = await Review.findOne({ userId: uid, productId: pid })
    .select("_id")
    .lean();
  if (reviewed) return { canReview: false, alreadyReviewed: true };
  const order = await Order.findOne({
    userId: uid,
    status: { $ne: "cancelled" },
    "items.productId": pid,
  })
    .select("_id")
    .lean();
  return { canReview: !!order, alreadyReviewed: false };
}

export async function listMyReviews(userId: string): Promise<MyReviewRow[]> {
  await connectDB();
  const docs = await Review.find({ userId }).sort({ createdAt: -1 }).lean();
  if (!docs.length) return [];
  const pids = Array.from(
    new Set(docs.map((d) => d.productId.toString())),
  );
  const products = await Product.find({ _id: { $in: pids } })
    .select("name slug")
    .lean();
  const pmap = new Map(products.map((p) => [p._id.toString(), p]));
  return docs.map((r) => {
    const p = pmap.get(r.productId.toString());
    return {
      id: r._id.toString(),
      rating: r.rating,
      title: r.title ?? "",
      comment: r.comment ?? "",
      authorDisplay: r.authorDisplay,
      createdAt: (r.createdAt as Date).toISOString(),
      productName: p?.name ?? "Product",
      productSlug: p?.slug ?? "",
    };
  });
}
