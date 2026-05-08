import { Schema, models, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    /** @deprecated prefer images; kept for legacy documents */
    imageUrl: { type: String, default: "" },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ categoryId: 1, isActive: 1 });
productSchema.index({ sellerId: 1, isActive: 1 });

export const Product = models.Product ?? model("Product", productSchema);
