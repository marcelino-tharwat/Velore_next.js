import { Schema, models, model } from "mongoose";

/** Stored role slug; must match `Role.slug` (seeded defaults preserve legacy values). */
export type UserRole = string;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    /** Required for email/password accounts; omitted for OAuth-only */
    passwordHash: { type: String, select: false },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    role: {
      type: String,
      default: "customer",
      maxlength: 64,
    },
    emailVerified: { type: Date, default: null },
    verificationToken: { type: String, select: false },
    verificationTokenExpires: { type: Date, default: null },
    phone: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "" },
    /** Set when admin bans the account (blocks sign-in). */
    bannedAt: { type: Date, default: null },
    /** Soft delete — blocks sign-in; hidden from default user lists. */
    deletedAt: { type: Date, default: null },
    /** Seller public/private profile fields. */
    sellerStoreName: { type: String, default: "" },
    sellerBio: { type: String, default: "" },
    sellerPayoutEmail: { type: String, default: "" },
    sellerProfileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = models.User ?? model("User", userSchema);
