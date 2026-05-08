import { Suspense } from "react";
import Link from "next/link";
import { SignOutSuspended } from "@/components/sign-out-suspended";
import { LoginForm } from "./login-form";
import { en } from "@/lib/site-copy";

function LoginFormFallback() {
  return (
    <div className="h-48 animate-pulse rounded-md bg-black/5 dark:bg-white/10" />
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: {
    verified?: string;
    registered?: string;
    callbackUrl?: string;
    error?: string;
  };
}) {
  const verified = searchParams.verified === "1";
  const registered = searchParams.registered === "1";
  const suspended = searchParams.error === "suspended";
  const defaultCallbackUrl = searchParams.callbackUrl ?? "/products";
  const showGoogle =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{en.auth.loginTitle}</h1>
        {verified ? (
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            {en.auth.verifiedOk}
          </p>
        ) : null}
        {registered && !verified ? (
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            {en.auth.registeredHint}
          </p>
        ) : null}
        {suspended ? (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
            {en.auth.suspended}
          </p>
        ) : null}
      </div>
      {suspended ? (
        <Suspense fallback={null}>
          <SignOutSuspended active />
        </Suspense>
      ) : null}
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm
          defaultCallbackUrl={defaultCallbackUrl}
          showGoogle={showGoogle}
        />
      </Suspense>
      <p className="text-center text-sm text-black/50 dark:text-white/50">
        <Link className="underline" href="/">
          {en.auth.backHome}
        </Link>
      </p>
    </main>
  );
}
