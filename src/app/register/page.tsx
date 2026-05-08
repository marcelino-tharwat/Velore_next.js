"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { registerUser, type AuthActionState } from "@/auth/actions";
import { en } from "@/lib/site-copy";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? en.registerPage.submitting : en.registerPage.submit}
    </button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useFormState<AuthActionState, FormData>(
    registerUser,
    {},
  );

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{en.registerPage.title}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {en.registerPage.subtitlePrefix}{" "}
          <Link className="underline" href="/login">
            {en.registerPage.subtitleLogin}
          </Link>
          . {en.registerPage.subtitleSuffix}
        </p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.registerPage.nameOptional}</span>
          <input
            name="name"
            type="text"
            maxLength={120}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Phone (optional)</span>
          <input
            name="phone"
            type="tel"
            maxLength={40}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.registerPage.email}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.registerPage.password}</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        {state.error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}
        <SubmitButton />
      </form>
    </main>
  );
}
