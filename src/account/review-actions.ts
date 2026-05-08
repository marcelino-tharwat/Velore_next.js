"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import { authOptions } from "@/auth/options";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(5000).optional(),
});

export type ReviewActionState = { error?: string; ok?: boolean };

async function userHasPurchasedProduct(
  userId: string,
  productOid: mongoose.Types.ObjectId,
): Promise<boolean> {
  const order = await Order.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: { $ne: "cancelled" },
    "items.productId": productOid,
  })
    .select("_id")
    .lean();
  return !!order;
}

export async function createReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sign in to leave a review" };
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") || "",
    comment: formData.get("comment") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review" };
  }
  const { productId, rating, title, comment } = parsed.data;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { error: "Invalid product" };
  }
  const pid = new mongoose.Types.ObjectId(productId);
  await connectDB();
  const product = await Product.findOne({ _id: pid, isActive: true });
  if (!product) return { error: "Product not found" };
  const purchased = await userHasPurchasedProduct(session.user.id, pid);
  if (!purchased) {
    return { error: "You can only review products you have ordered." };
  }
  const u = await User.findById(session.user.id).select("name email").lean();
  const authorDisplay =
    (u?.name && u.name.trim()) ||
    (u?.email ? u.email.split("@")[0] : "Customer");
  try {
    await Review.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      productId: pid,
      rating,
      title: title ?? "",
      comment: comment ?? "",
      authorDisplay: authorDisplay.slice(0, 120),
    });
  } catch {
    return { error: "You already reviewed this product." };
  }
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/account/reviews");
  revalidatePath("/products");
  return { ok: true };
}
