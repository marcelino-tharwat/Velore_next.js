import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { getProfileFields, listPaymentMethods } from "@/account/queries";
import { authOptions } from "@/auth/options";
import { getCartLines } from "@/cart/actions";
import { CheckoutView } from "@/components/checkout-view";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  const authed = !!session?.user?.id;
  const accountEmail = session?.user?.email ?? null;

  let memberLines: Awaited<ReturnType<typeof getCartLines>> = [];
  let profile = null;
  let defaultPaymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null = null;

  if (authed && session.user.id) {
    const [lines, userProfile, methods] = await Promise.all([
      getCartLines(),
      getProfileFields(session.user.id),
      listPaymentMethods(session.user.id),
    ]);
    memberLines = lines;
    if (!memberLines.length) {
      redirect("/cart");
    }
    profile = userProfile;
    const preferred = methods.find((m) => m.isDefault) ?? methods[0];
    if (preferred) {
      defaultPaymentMethod = {
        brand: preferred.brand,
        last4: preferred.last4,
        expMonth: preferred.expMonth,
        expYear: preferred.expYear,
      };
    }
  }

  return (
    <CheckoutView
      isAuthenticated={authed}
      memberLines={memberLines}
      profile={profile}
      accountEmail={accountEmail}
      defaultPaymentMethod={defaultPaymentMethod}
    />
  );
}
