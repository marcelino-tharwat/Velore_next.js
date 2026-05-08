import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Payment } from "@/models/Payment";
import { Order } from "@/models/Order";
const paymentStatuses = ["pending", "paid", "failed"] as const;
type PaymentStatus = (typeof paymentStatuses)[number];

export type AdminPaymentRow = {
  id: string;
  orderId: string;
  userId?: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  provider: string;
  transactionId: string;
  providerSessionId: string;
  failureReason: string;
  createdAt: string;
  updatedAt: string;
};

function mapPaymentDoc(p: Record<string, unknown>): AdminPaymentRow {
  return {
    id: (p._id as { toString(): string }).toString(),
    orderId: (p.orderId as { toString(): string }).toString(),
    userId: p.userId ? (p.userId as { toString(): string }).toString() : undefined,
    method: String(p.method ?? "cod"),
    status: (String(p.status ?? "pending") as PaymentStatus) ?? "pending",
    amount: Number(p.amount ?? 0),
    currency: String(p.currency ?? "usd"),
    provider: String(p.provider ?? ""),
    transactionId: String(p.transactionId ?? ""),
    providerSessionId: String(p.providerSessionId ?? ""),
    failureReason: String(p.failureReason ?? ""),
    createdAt: (p.createdAt as Date).toISOString(),
    updatedAt: (p.updatedAt as Date).toISOString(),
  };
}

export async function listPaymentsForAdmin(limit = 120): Promise<AdminPaymentRow[]> {
  await connectDB();
  const docs = await Payment.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(300, Math.max(1, limit)))
    .lean();
  return docs.map((p) => mapPaymentDoc(p as unknown as Record<string, unknown>));
}

export async function getPaymentForAdmin(id: string): Promise<AdminPaymentRow | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const doc = await Payment.findById(id).lean();
  if (!doc) return null;
  return mapPaymentDoc(doc as unknown as Record<string, unknown>);
}

export async function updatePaymentAdmin(params: {
  id: string;
  status?: PaymentStatus;
  transactionId?: string;
  failureReason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return { ok: false, error: "Invalid payment id" };
  }
  if (params.status && !paymentStatuses.includes(params.status)) {
    return { ok: false, error: "Invalid status" };
  }
  await connectDB();
  const payment = await Payment.findById(params.id);
  if (!payment) return { ok: false, error: "Payment not found" };

  if (params.status) payment.status = params.status;
  if (params.transactionId !== undefined) {
    payment.transactionId = params.transactionId.slice(0, 200);
  }
  if (params.failureReason !== undefined) {
    payment.failureReason = params.failureReason.slice(0, 500);
  }
  await payment.save();

  await Order.updateOne(
    { _id: payment.orderId },
    { $set: { paymentStatus: payment.status, paymentMethod: payment.method } },
  );
  return { ok: true };
}
