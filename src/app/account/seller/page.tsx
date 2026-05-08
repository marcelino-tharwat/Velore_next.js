import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { becomeSellerAccount } from "@/seller/profile-actions";
import { SellerProfileForm } from "./seller-profile-form";

export const dynamic = "force-dynamic";

export default async function AccountSellerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/seller");
  await connectDB();
  const user = await User.findById(session.user.id)
    .select("role sellerStoreName sellerBio sellerPayoutEmail sellerProfileCompleted")
    .lean();
  if (!user) redirect("/login");

  const role = normalizeRole(user.role as string);

  if (role !== "seller") {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Seller registration</h1>
        <p className="mt-2 text-sm text-muted">
          Register as a seller to list your products and process vendor orders.
        </p>
        <form action={becomeSellerAccount} className="mt-6">
          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Become a seller
          </button>
        </form>
      </div>
    );
  }

  // Client wrapper for useFormState to keep existing server-action flow.
  return (
    <SellerProfileForm
      initial={{
        sellerStoreName: String((user as { sellerStoreName?: string }).sellerStoreName ?? ""),
        sellerBio: String((user as { sellerBio?: string }).sellerBio ?? ""),
        sellerPayoutEmail: String((user as { sellerPayoutEmail?: string }).sellerPayoutEmail ?? ""),
        sellerProfileCompleted: Boolean(
          (user as { sellerProfileCompleted?: boolean }).sellerProfileCompleted,
        ),
      }}
    />
  );
}
