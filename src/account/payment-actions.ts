"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { PaymentMethod } from "@/models/PaymentMethod";
import { authOptions } from "@/auth/options";
import { paymentErrors } from "@/lib/site-copy";

const addSchema = z.object({
  label: z.string().max(80).optional(),
  brand: z.enum(["Visa", "Mastercard", "Amex", "Other"]).default("Visa"),
  last4: z.string().regex(/^\d{4}$/, paymentErrors.last4Digits),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(2026).max(2100),
});

export type PaymentActionState = { error?: string; ok?: boolean };

export async function addPaymentMethod(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: paymentErrors.unauthorized };
  const parsed = addSchema.safeParse({
    label: formData.get("label") || "My card",
    brand: formData.get("brand") || "Visa",
    last4: formData.get("last4"),
    expMonth: formData.get("expMonth"),
    expYear: formData.get("expYear"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? paymentErrors.invalidInput,
    };
  }
  const d = parsed.data;
  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);
  const count = await PaymentMethod.countDocuments({ userId: uid });
  await PaymentMethod.create({
    userId: uid,
    label: d.label ?? "My card",
    brand: d.brand,
    last4: d.last4,
    expMonth: d.expMonth,
    expYear: d.expYear,
    isDefault: count === 0,
  });
  revalidatePath("/account/payment");
  return { ok: true };
}

export async function setDefaultPaymentMethod(
  paymentId: string,
): Promise<PaymentActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: paymentErrors.unauthorized };
  if (!mongoose.Types.ObjectId.isValid(paymentId))
    return { error: paymentErrors.invalidId };
  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);
  const doc = await PaymentMethod.findOne({ _id: paymentId, userId: uid });
  if (!doc) return { error: paymentErrors.notFound };
  await PaymentMethod.updateMany({ userId: uid }, { $set: { isDefault: false } });
  doc.isDefault = true;
  await doc.save();
  revalidatePath("/account/payment");
  return { ok: true };
}

export async function deletePaymentMethodFromForm(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await deletePaymentMethod(id);
}

export async function setDefaultPaymentMethodFromForm(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await setDefaultPaymentMethod(id);
}

export async function deletePaymentMethod(
  paymentId: string,
): Promise<PaymentActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: paymentErrors.unauthorized };
  if (!mongoose.Types.ObjectId.isValid(paymentId))
    return { error: paymentErrors.invalidId };
  await connectDB();
  const uid = new mongoose.Types.ObjectId(session.user.id);
  const doc = await PaymentMethod.findOneAndDelete({ _id: paymentId, userId: uid });
  if (!doc) return { error: paymentErrors.notFound };
  if (doc.isDefault) {
    const next = await PaymentMethod.findOne({ userId: uid }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  revalidatePath("/account/payment");
  return { ok: true };
}
