import { Schema, models, model } from "mongoose";

const homeBannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "" },
    href: { type: String, default: "/products" },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const HomeBanner =
  models.HomeBanner ?? model("HomeBanner", homeBannerSchema);
