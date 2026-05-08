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

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    shippingAddress: { type: shippingAddressSchema, required: false },
    items: { type: [orderItemSchema], required: true },
    /** Sum of line prices × qty before discount */
    subtotal: { type: Number },
    shipping: { type: Number },
    tax: { type: Number },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "paid",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "stripe"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "unpaid", "paid", "failed"],
      default: "pending",
    },
    /** Legacy placeholder id from older dev flows */
    stripeMockPaymentIntentId: { type: String, default: "" },
    /** Stripe Checkout Session id when paid via Stripe */
    stripeCheckoutSessionId: { type: String, default: "" },
    promoCodeApplied: { type: String, default: "" },
    /** Public receipt lookup with order id */
    confirmationToken: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    shippedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Order = models.Order ?? model("Order", orderSchema);
