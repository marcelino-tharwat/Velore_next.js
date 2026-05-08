"use server";

import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export type VerifyResult = { ok: true } | { ok: false; reason: "invalid" | "expired" };

export async function verifyEmailWithToken(
  token: string | undefined,
): Promise<VerifyResult> {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "invalid" };
  }
  await connectDB();
  const user = await User.findOne({ verificationToken: token }).select(
    "+verificationToken",
  );
  if (!user || !user.verificationTokenExpires) {
    return { ok: false, reason: "invalid" };
  }
  if (user.verificationTokenExpires.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  user.emailVerified = new Date();
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  return { ok: true };
}
