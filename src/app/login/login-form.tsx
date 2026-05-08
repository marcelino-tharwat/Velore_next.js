"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import { resendVerificationEmail, type ResendState } from "@/auth/actions";
import { en } from "@/lib/site-copy";

function ResendSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/20 disabled:opacity-60"
    >
      {pending ? en.auth.resendSending : en.auth.resendSubmit}
    </button>
  );
}

function ResendBlock() {
  const [state, formAction] = useFormState<ResendState, FormData>(
    resendVerificationEmail,
    {},
  );

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <p className="text-sm font-medium">{en.auth.resendTitle}</p>
      <p className="mt-1 text-xs text-black/55 dark:text-white/55">{en.auth.resendHint}</p>
      <form action={formAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          placeholder="name@example.com"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
        <ResendSubmit />
      </form>
      {state.error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok && state.previewVerificationUrl ? (
        <p className="mt-2 break-all text-xs text-green-800 dark:text-green-300">
          {en.auth.verificationLinkLabel}{" "}
          <Link className="underline" href={state.previewVerificationUrl}>
            {state.previewVerificationUrl}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function LoginForm({
  defaultCallbackUrl,
  showGoogle,
}: {
  defaultCallbackUrl: string;
  showGoogle: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? defaultCallbackUrl;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      if (res.error === "EmailNotVerified") {
        setError(en.auth.verifyEmailFirst);
      } else {
        setError(en.auth.invalidCredentials);
      }
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {showGoogle ? (
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/[0.03] dark:border-white/20 dark:hover:bg-white/[0.05]"
            onClick={() => signIn("google", { callbackUrl })}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {en.auth.continueGoogle}
          </button>
          <p className="mt-3 text-xs text-black/50 dark:text-white/50">{en.auth.googleHint}</p>
        </div>
      ) : null}

      {showGoogle ? (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/10 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-black/50 dark:text-white/50">
              {en.auth.orEmail}
            </span>
          </div>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.auth.email}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.auth.password}</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          {pending ? en.auth.signingIn : en.auth.signIn}
        </button>
        <p className="text-sm text-black/60 dark:text-white/60">
          {en.auth.newUser}{" "}
          <Link className="underline" href="/register">
            {en.auth.createAccount}
          </Link>
        </p>
      </form>

      <ResendBlock />
    </div>
  );
}
