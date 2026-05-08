"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { adminUserBanForm, adminUserDeleteForm } from "@/admin/user-actions";
import type { AdminUserRow } from "@/lib/admin/users";

export type AdminUsersTableCopy = {
  thEmail: string;
  thName: string;
  thRole: string;
  thStatus: string;
  thActions: string;
  statusActive: string;
  statusBanned: string;
  statusDeleted: string;
  ban: string;
  unban: string;
  softDelete: string;
  restore: string;
  youLabel: string;
  addUser: string;
  addUserModalTitle: string;
  addUserNameLabel: string;
  addUserEmailLabel: string;
  addUserPasswordLabel: string;
  addUserRoleLabel: string;
  addUserSubmit: string;
  addUserCancel: string;
  roleUpdating: string;
  toastRoleUpdated: string;
  toastRoleFailed: string;
  toastUserCreated: string;
  toastUserCreateFailed: string;
  addUserCreating: string;
  rolesLoading: string;
};

type ToastState = { message: string; kind: "success" | "error" };

function useAdminToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, kind: "success" | "error") => {
    setToast({ message, kind });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  return { toast, showToast };
}

function AdminRoleSelect({
  userId,
  role: serverRole,
  disabled,
  copy,
  onToast,
  options,
}: {
  userId: string;
  role: string;
  disabled: boolean;
  copy: AdminUsersTableCopy;
  onToast: (message: string, kind: "success" | "error") => void;
  options: { slug: string; name: string }[];
}) {
  const [role, setRole] = useState(serverRole);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setRole(serverRole);
  }, [serverRole]);

  async function handleChange(next: string) {
    if (next === role || disabled) return;
    const previous = role;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setRole(previous);
        onToast(data.error ?? copy.toastRoleFailed, "error");
        return;
      }
      setRole(next);
      onToast(copy.toastRoleUpdated, "success");
    } catch {
      setRole(previous);
      onToast(copy.toastRoleFailed, "error");
    } finally {
      setPending(false);
    }
  }

  if (!options.length) {
    return (
      <span className="text-xs text-black/50 dark:text-white/45">
        {copy.rolesLoading}
      </span>
    );
  }

  return (
    <select
      value={options.some((o) => o.slug === role) ? role : options[0]!.slug}
      disabled={disabled || pending}
      title={pending ? copy.roleUpdating : undefined}
      aria-busy={pending}
      onChange={(e) => void handleChange(e.target.value)}
      className="max-w-[12rem] rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs disabled:opacity-60 dark:border-white/20"
    >
      {options.map((r) => (
        <option key={r.slug} value={r.slug}>
          {r.name}
        </option>
      ))}
    </select>
  );
}

export function AdminUsersTable({
  users,
  sessionUserId,
  copy,
}: {
  users: AdminUserRow[];
  sessionUserId: string;
  copy: AdminUsersTableCopy;
}) {
  const router = useRouter();
  const { toast, showToast } = useAdminToast();
  const [roleCatalog, setRoleCatalog] = useState<{ slug: string; name: string }[]>(
    [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState("customer");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/roles");
        const data = (await res.json()) as {
          roles?: { slug: string; name: string }[];
        };
        if (!cancelled && res.ok && Array.isArray(data.roles)) {
          setRoleCatalog(data.roles);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedRoleOptions = useMemo(() => {
    const m = new Map(roleCatalog.map((r) => [r.slug, r]));
    for (const u of users) {
      const slug = (u.role ?? "").trim();
      if (slug && !m.has(slug)) {
        m.set(slug, { slug, name: slug });
      }
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [roleCatalog, users]);

  useEffect(() => {
    if (!mergedRoleOptions.length) return;
    if (!mergedRoleOptions.some((r) => r.slug === newRole)) {
      const pref = mergedRoleOptions.find((r) => r.slug === "customer");
      setNewRole(pref?.slug ?? mergedRoleOptions[0]!.slug);
    }
  }, [mergedRoleOptions, newRole]);

  function closeModal() {
    if (creating) return;
    setModalOpen(false);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          password,
          role: newRole,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error ?? copy.toastUserCreateFailed, "error");
        return;
      }
      showToast(copy.toastUserCreated, "success");
      setName("");
      setEmail("");
      setPassword("");
      const pref = mergedRoleOptions.find((r) => r.slug === "customer");
      setNewRole(pref?.slug ?? mergedRoleOptions[0]?.slug ?? "customer");
      setModalOpen(false);
      router.refresh();
    } catch {
      showToast(copy.toastUserCreateFailed, "error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-[100] max-w-sm rounded-md px-4 py-2 text-sm shadow-lg ${
            toast.kind === "success"
              ? "bg-emerald-800 text-white dark:bg-emerald-700"
              : "bg-red-800 text-white dark:bg-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-md border border-black/15 bg-black/[0.04] px-3 py-2 text-sm font-medium dark:border-white/20 dark:bg-white/[0.08]"
        >
          {copy.addUser}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]">
            <tr>
              <th className="px-3 py-2 font-medium">{copy.thEmail}</th>
              <th className="px-3 py-2 font-medium">{copy.thName}</th>
              <th className="px-3 py-2 font-medium">{copy.thRole}</th>
              <th className="px-3 py-2 font-medium">{copy.thStatus}</th>
              <th className="px-3 py-2 font-medium">{copy.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-black/5 last:border-0 dark:border-white/10"
              >
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.name || "—"}</td>
                <td className="px-3 py-2">
                  <AdminRoleSelect
                    userId={u.id}
                    role={u.role}
                    disabled={u.id === sessionUserId}
                    copy={copy}
                    onToast={showToast}
                    options={mergedRoleOptions}
                  />
                </td>
                <td className="px-3 py-2 text-black/65 dark:text-white/65">
                  {u.deletedAt ? (
                    <span>{copy.statusDeleted}</span>
                  ) : u.bannedAt ? (
                    <span>{copy.statusBanned}</span>
                  ) : (
                    <span>{copy.statusActive}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {u.id !== sessionUserId ? (
                      <>
                        <form action={adminUserBanForm}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="banned"
                            value={u.bannedAt ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className="text-xs text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
                          >
                            {u.bannedAt ? copy.unban : copy.ban}
                          </button>
                        </form>
                        <form action={adminUserDeleteForm}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="deleted"
                            value={u.deletedAt ? "false" : "true"}
                          />
                          <button
                            type="submit"
                            className="text-xs text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                          >
                            {u.deletedAt ? copy.restore : copy.softDelete}
                          </button>
                        </form>
                      </>
                    ) : (
                      <span className="text-xs text-black/45 dark:text-white/45">
                        {copy.youLabel}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-add-user-title"
            className="w-full max-w-md rounded-lg border border-black/10 bg-white p-5 shadow-xl dark:border-white/15 dark:bg-zinc-900"
          >
            <h2
              id="admin-add-user-title"
              className="text-lg font-semibold text-black dark:text-white"
            >
              {copy.addUserModalTitle}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={(e) => void handleCreate(e)}>
              <label className="block text-sm">
                <span className="text-black/70 dark:text-white/70">
                  {copy.addUserNameLabel}
                </span>
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creating}
                  className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
                />
              </label>
              <label className="block text-sm">
                <span className="text-black/70 dark:text-white/70">
                  {copy.addUserEmailLabel}
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={creating}
                  className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
                />
              </label>
              <label className="block text-sm">
                <span className="text-black/70 dark:text-white/70">
                  {copy.addUserPasswordLabel}
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={creating}
                  className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
                />
              </label>
              <label className="block text-sm">
                <span className="text-black/70 dark:text-white/70">
                  {copy.addUserRoleLabel}
                </span>
                <select
                  name="role"
                  value={
                    mergedRoleOptions.some((r) => r.slug === newRole)
                      ? newRole
                      : mergedRoleOptions[0]?.slug ?? ""
                  }
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={creating || !mergedRoleOptions.length}
                  className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
                >
                  {mergedRoleOptions.map((r) => (
                    <option key={r.slug} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="rounded-md border border-black/15 px-3 py-2 text-sm disabled:opacity-50 dark:border-white/20"
                >
                  {copy.addUserCancel}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {creating ? copy.addUserCreating : copy.addUserSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
