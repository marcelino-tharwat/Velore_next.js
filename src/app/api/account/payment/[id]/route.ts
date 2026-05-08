import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { PaymentMethod } from "@/models/PaymentMethod";
import { authOptions } from "@/auth/options";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);
  const doc = await PaymentMethod.findOneAndDelete({ _id: id, userId: uid });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doc.isDefault) {
    const next = await PaymentMethod.findOne({ userId: uid }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);
  const doc = await PaymentMethod.findOne({ _id: id, userId: uid });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await PaymentMethod.updateMany({ userId: uid }, { $set: { isDefault: false } });
  doc.isDefault = true;
  await doc.save();
  return NextResponse.json({ ok: true });
}
