import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import {
  getReviewEligibility,
  listReviewsForProduct,
} from "@/account/queries";
import { connectDB } from "@/lib/db/mongoose";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { User } from "@/models/User";
import { authOptions } from "@/auth/options";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(5000).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  const reviews = await listReviewsForProduct(id);
  return NextResponse.json({ reviews });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }
  const pid = new mongoose.Types.ObjectId(productId);
  await connectDB();
  const product = await Product.findOne({ _id: pid, isActive: true });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const { canReview, alreadyReviewed } = await getReviewEligibility(
    session.user.id,
    productId,
  );
  if (alreadyReviewed) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }
  if (!canReview) {
    return NextResponse.json(
      { error: "Only customers who purchased this product may review." },
      { status: 403 },
    );
  }
  const u = await User.findById(session.user.id).select("name email").lean();
  const authorDisplay =
    (u?.name && u.name.trim()) ||
    (u?.email ? u.email.split("@")[0] : "Customer");
  try {
    await Review.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      productId: pid,
      rating: parsed.data.rating,
      title: parsed.data.title ?? "",
      comment: parsed.data.comment ?? "",
      authorDisplay: authorDisplay.slice(0, 120),
    });
  } catch {
    return NextResponse.json({ error: "Duplicate review" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
