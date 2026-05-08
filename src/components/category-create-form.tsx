"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createCategory,
  type CategoryActionState,
} from "@/categories/actions";

function SubmitCategory() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? "Creating…" : "Add category"}
    </button>
  );
}

export function CategoryCreateForm() {
  const [state, formAction] = useFormState<CategoryActionState, FormData>(
    createCategory,
    {},
  );

  return (
    <form
      action={formAction}
      className="grid max-w-md gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <h2 className="text-sm font-medium">New category</h2>
      <label className="flex flex-col gap-1 text-xs">
        <span>Name</span>
        <input
          name="name"
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span>Slug (optional)</span>
        <input
          name="slug"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span>Description</span>
        <textarea
          name="description"
          rows={2}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      {state.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs text-green-700 dark:text-green-400">Created.</p>
      ) : null}
      <SubmitCategory />
    </form>
  );
}
