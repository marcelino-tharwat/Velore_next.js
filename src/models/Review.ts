import { Schema, models, model } from "mongoose";

const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", maxlength: 200 },
    comment: { type: String, default: "", maxlength: 5000 },
    /** Snapshot for display without joining user */
    authorDisplay: { type: String, required: true, maxlength: 120 },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const Review = models.Review ?? model("Review", reviewSchema);
