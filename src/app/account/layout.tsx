import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { authOptions } from "@/auth/options";
import { AccountShell } from "@/components/account-shell";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }
  await connectDB();
  const u = await User.findById(session.user.id)
    .select("bannedAt deletedAt")
    .lean();
  if (u?.bannedAt || u?.deletedAt) {
    redirect("/login?error=suspended");
  }
  return <AccountShell>{children}</AccountShell>;
}
