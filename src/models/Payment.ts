import { Schema, models, model } from "mongoose";

const paymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    method: {
      type: String,
      enum: ["cod", "stripe"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "usd", lowercase: true, maxlength: 8 },
    transactionId: { type: String, default: "" },
    provider: { type: String, default: "" },
    providerSessionId: { type: String, default: "" },
    rawProviderPayload: { type: Schema.Types.Mixed, default: null },
    failureReason: { type: String, default: "" },
  },
  { timestamps: true },
);

paymentSchema.index({ createdAt: -1 });

export const Payment = models.Payment ?? model("Payment", paymentSchema);
