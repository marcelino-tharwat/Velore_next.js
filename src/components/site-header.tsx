import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth/options";
import { isAdmin, isSeller } from "@/lib/auth/roles";
import { SiteHeaderInner } from "@/components/site-header-inner";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  return (
    <SiteHeaderInner
      isSignedIn={!!session?.user}
      email={session?.user?.email ?? null}
      showSeller={isSeller(role)}
      showAdmin={isAdmin(role)}
    />
  );
}
