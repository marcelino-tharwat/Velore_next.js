import { Schema, models, model } from "mongoose";

/** Limited card display data for the account (last 4 + expiry). */
const paymentMethodSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: { type: String, default: "Card" },
    brand: { type: String, default: "Visa" },
    last4: { type: String, required: true, maxlength: 4 },
    expMonth: { type: Number, required: true, min: 1, max: 12 },
    expYear: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

paymentMethodSchema.index({ userId: 1, isDefault: 1 });

export const PaymentMethod =
  models.PaymentMethod ?? model("PaymentMethod", paymentMethodSchema);
