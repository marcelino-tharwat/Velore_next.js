import { Schema, models, model } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      maxlength: 64,
    },
  },
  { timestamps: true },
);

export const Role = models.Role ?? model("Role", roleSchema);
