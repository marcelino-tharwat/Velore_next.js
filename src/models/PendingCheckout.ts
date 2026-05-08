import { Schema, models, model } from "mongoose";

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema(
  {
    email: { type: String, required: true },
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" },
  },
  { _id: false },
);

const pendingCheckoutSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    promoCodeApplied: { type: String, default: "" },
    confirmationToken: { type: String, required: true },
    /** Set when Checkout Session is created */
    stripeSessionId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed", "expired"],
      default: "pending",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

pendingCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingCheckout =
  models.PendingCheckout ?? model("PendingCheckout", pendingCheckoutSchema);
