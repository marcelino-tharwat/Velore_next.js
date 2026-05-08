import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Payment } from "@/models/Payment";
import { Order } from "@/models/Order";

type PaymentMethod = "cod" | "stripe";
type PaymentStatus = "pending" | "paid" | "failed";

export async function upsertPaymentRecord(params: {
  orderId: mongoose.Types.ObjectId | string;
  userId?: mongoose.Types.ObjectId | string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency?: string;
  transactionId?: string;
  provider?: string;
  providerSessionId?: string;
  rawProviderPayload?: unknown;
  failureReason?: string;
}): Promise<void> {
  const oid =
    typeof params.orderId === "string"
      ? new mongoose.Types.ObjectId(params.orderId)
      : params.orderId;
  const uid =
    params.userId && typeof params.userId === "string"
      ? new mongoose.Types.ObjectId(params.userId)
      : (params.userId ?? null);

  await connectDB();
  await Payment.updateOne(
    { orderId: oid },
    {
      $set: {
        userId: uid,
        method: params.method,
        status: params.status,
        amount: Math.max(0, params.amount),
        currency: (params.currency ?? "usd").toLowerCase(),
        transactionId: params.transactionId ?? "",
        provider: params.provider ?? "",
        providerSessionId: params.providerSessionId ?? "",
        rawProviderPayload: params.rawProviderPayload ?? null,
        failureReason: params.failureReason ?? "",
      },
    },
    { upsert: true },
  );

  await Order.updateOne(
    { _id: oid },
    {
      $set: {
        paymentMethod: params.method,
        paymentStatus: params.status,
        ...(params.providerSessionId
          ? { stripeCheckoutSessionId: params.providerSessionId }
          : {}),
      },
    },
  );
}
