import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return null;
  }
  return session;
}
