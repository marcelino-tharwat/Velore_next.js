"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { authOptions } from "@/auth/options";
import { profileErrors } from "@/lib/site-copy";

const profileSchema = z.object({
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  addressLine1: z.string().max(200).optional(),
  addressLine2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
});

export type ProfileActionState = { error?: string; ok?: boolean };

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: profileErrors.unauthorized };
  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    addressLine1: formData.get("addressLine1") ?? "",
    addressLine2: formData.get("addressLine2") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    country: formData.get("country") ?? "",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? profileErrors.invalidInput,
    };
  }
  await connectDB();
  await User.updateOne({ _id: session.user.id }, { $set: parsed.data });
  revalidatePath("/account");
  return { ok: true };
}
