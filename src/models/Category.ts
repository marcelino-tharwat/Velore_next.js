import { Schema, models, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true },
);

export const Category = models.Category ?? model("Category", categorySchema);
