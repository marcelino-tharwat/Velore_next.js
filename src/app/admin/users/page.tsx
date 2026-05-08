import Link from "next/link";
import { getAdminSession } from "@/lib/admin/session";
import { listUsersForAdmin } from "@/lib/admin/users";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; deleted?: string };
}) {
  const session = await getAdminSession();
  if (!session) return null;
  const users = await listUsersForAdmin({
    search: searchParams.q,
    includeDeleted: searchParams.deleted === "1",
    limit: 80,
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{en.admin.pageUsersTitle}</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {en.admin.usersIntro}
          </p>
        </div>
        <Link
          href={
            searchParams.deleted === "1"
              ? "/admin/users"
              : "/admin/users?deleted=1"
          }
          className="text-sm underline"
        >
          {searchParams.deleted === "1"
            ? en.admin.hideDeleted
            : en.admin.showDeleted}
        </Link>
      </div>

      <form className="mt-6 flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder={en.admin.searchPlaceholder}
          className="min-w-[12rem] rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
        {searchParams.deleted === "1" ? (
          <input type="hidden" name="deleted" value="1" />
        ) : null}
        <button
          type="submit"
          className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
        >
          {en.admin.searchButton}
        </button>
      </form>

      <div className="mt-8">
        <AdminUsersTable
          users={users}
          sessionUserId={session.user.id}
          copy={{
            thEmail: en.admin.thEmail,
            thName: en.admin.thName,
            thRole: en.admin.thRole,
            thStatus: en.admin.thStatus,
            thActions: en.admin.thActions,
            statusActive: en.admin.statusActive,
            statusBanned: en.admin.statusBanned,
            statusDeleted: en.admin.statusDeleted,
            ban: en.admin.ban,
            unban: en.admin.unban,
            softDelete: en.admin.softDelete,
            restore: en.admin.restore,
            youLabel: en.admin.youLabel,
            addUser: en.admin.addUser,
            addUserModalTitle: en.admin.addUserModalTitle,
            addUserNameLabel: en.admin.addUserNameLabel,
            addUserEmailLabel: en.admin.addUserEmailLabel,
            addUserPasswordLabel: en.admin.addUserPasswordLabel,
            addUserRoleLabel: en.admin.addUserRoleLabel,
            addUserSubmit: en.admin.addUserSubmit,
            addUserCreating: en.admin.addUserCreating,
            addUserCancel: en.admin.addUserCancel,
            roleUpdating: en.admin.roleUpdating,
            toastRoleUpdated: en.admin.toastRoleUpdated,
            toastRoleFailed: en.admin.toastRoleFailed,
            toastUserCreated: en.admin.toastUserCreated,
            toastUserCreateFailed: en.admin.toastUserCreateFailed,
            rolesLoading: en.admin.rolesLoading,
          }}
        />
      </div>
    </div>
  );
}
