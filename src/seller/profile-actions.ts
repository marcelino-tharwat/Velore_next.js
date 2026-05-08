"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export type SellerProfileActionState = { ok?: boolean; error?: string };

const sellerProfileSchema = z.object({
  sellerStoreName: z.string().min(2).max(120),
  sellerBio: z.string().max(1200).optional(),
  sellerPayoutEmail: z.string().email(),
});

export async function becomeSellerAccount(formData: FormData): Promise<void> {
  void formData;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;
  await connectDB();
  const user = await User.findById(session.user.id).select("role");
  if (!user) return;
  if (normalizeRole(user.role) === "customer") {
    user.role = "seller";
    await user.save();
  }
  revalidatePath("/account/seller");
  revalidatePath("/seller");
}

export async function updateSellerProfile(
  _prev: SellerProfileActionState,
  formData: FormData,
): Promise<SellerProfileActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = sellerProfileSchema.safeParse({
    sellerStoreName: formData.get("sellerStoreName"),
    sellerBio: formData.get("sellerBio") ?? "",
    sellerPayoutEmail: formData.get("sellerPayoutEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await connectDB();
  await User.updateOne(
    { _id: session.user.id },
    {
      $set: {
        sellerStoreName: parsed.data.sellerStoreName.trim(),
        sellerBio: (parsed.data.sellerBio ?? "").trim(),
        sellerPayoutEmail: parsed.data.sellerPayoutEmail.trim().toLowerCase(),
        sellerProfileCompleted: true,
      },
    },
  );
  revalidatePath("/account/seller");
  revalidatePath("/seller");
  return { ok: true };
}
