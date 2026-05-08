"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Cart } from "@/models/Cart";
import { authDebug } from "@/lib/auth/debug-log";
import { isMockEmailVerification } from "@/lib/auth/email-verification-env";
const registerSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .transform((e) => e.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters."),
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
});

export type AuthActionState = { error?: string; ok?: boolean };

export async function registerUser(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Could not complete registration." };
  }
  const { email, password, name, phone } = parsed.data;
  await connectDB();
  authDebug("register:lookup", { email });
  const existing = await User.findOne({ email });
  if (existing) {
    authDebug("register:abort", { reason: "email_taken", email });
    return { error: "An account with this email already exists." };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  authDebug("register:password_hashed", { rounds: 12, email });

  const mockVerify = isMockEmailVerification();
  const verificationToken = mockVerify
    ? undefined
    : randomBytes(32).toString("hex");
  const verificationTokenExpires = mockVerify
    ? undefined
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    email,
    passwordHash,
    name: name ?? "",
    role: "customer",
    phone: phone ?? "",
    emailVerified: mockVerify ? new Date() : null,
    verificationToken,
    verificationTokenExpires,
  });
  authDebug("register:user_created", {
    id: user._id.toString(),
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    mockAutoVerify: mockVerify,
  });

  try {
    await Cart.create({ userId: user._id, items: [] });
  } catch {
    /* cart may already exist */
  }

  if (mockVerify) {
    redirect(`/login?registered=1&verified=1`);
  }
  redirect(`/verify-email/pending?email=${encodeURIComponent(email)}`);
}

const resendSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
});

export type ResendState = {
  error?: string;
  ok?: boolean;
  /** Shown in dev when email isn’t sent for real */
  previewVerificationUrl?: string;
};

export async function resendVerificationEmail(
  _prev: ResendState,
  formData: FormData,
): Promise<ResendState> {
  const parsed = resendSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }
  const { email } = parsed.data;
  await connectDB();
  authDebug("resend:lookup", { email });
  const user = await User.findOne({ email }).select(
    "+passwordHash +verificationToken",
  );
  if (!user) {
    return { ok: true };
  }
  if (!user.passwordHash) {
    return {
      error:
        "This email uses Google sign-in. Use “Continue with Google” on the log in page.",
    };
  }
  if (user.emailVerified) {
    return { error: "This email is already verified. You can sign in." };
  }
  const verificationToken = randomBytes(32).toString("hex");
  user.verificationToken = verificationToken;
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  const previewVerificationUrl = buildVerificationLink(verificationToken);
  return { ok: true, previewVerificationUrl };
}

function buildVerificationLink(token: string): string {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    (typeof process.env.VERCEL_URL === "string"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}
