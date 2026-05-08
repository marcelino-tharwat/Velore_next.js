import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { getProfileFields } from "@/account/queries";
import { authOptions } from "@/auth/options";
import { ProfileForm } from "@/components/profile-form";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");
  const initial = await getProfileFields(session.user.id);
  if (!initial) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-semibold">{en.account.profileTitle}</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {en.account.profileIntro}
      </p>
      <div className="mt-8">
        <ProfileForm initial={initial} />
      </div>
    </div>
  );
}
