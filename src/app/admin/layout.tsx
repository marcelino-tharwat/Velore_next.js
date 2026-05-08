import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12 lg:px-8">
      <aside className="shrink-0 rounded-2xl border border-border bg-card p-4 shadow-card lg:w-56 lg:self-start lg:p-5">
        <Link
          href="/admin"
          className="text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Admin
        </Link>
        <div className="mt-4">
          <Suspense fallback={null}>
            <AdminNav />
          </Suspense>
        </div>
      </aside>
      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
        {children}
      </div>
    </div>
  );
}
