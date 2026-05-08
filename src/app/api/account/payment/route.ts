import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import { listPaymentMethods } from "@/account/queries";
import { connectDB } from "@/lib/db/mongoose";
import { PaymentMethod } from "@/models/PaymentMethod";
import { authOptions } from "@/auth/options";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  label: z.string().max(80).optional(),
  brand: z.enum(["Visa", "Mastercard", "Amex", "Other"]).default("Visa"),
  last4: z.string().regex(/^\d{4}$/),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(2024).max(2100),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const methods = await listPaymentMethods(session.user.id);
  return NextResponse.json({ methods });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const d = parsed.data;
  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);
  const count = await PaymentMethod.countDocuments({ userId: uid });
  const doc = await PaymentMethod.create({
    userId: uid,
    label: d.label ?? "My card",
    brand: d.brand,
    last4: d.last4,
    expMonth: d.expMonth,
    expYear: d.expYear,
    isDefault: count === 0,
  });
  return NextResponse.json({
    method: {
      id: doc._id.toString(),
      label: doc.label,
      brand: doc.brand,
      last4: doc.last4,
      expMonth: doc.expMonth,
      expYear: doc.expYear,
      isDefault: doc.isDefault,
    },
  });
}
