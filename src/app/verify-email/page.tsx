import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyEmailWithToken } from "@/auth/verification";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{en.verifyEmail.invalidLinkTitle}</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          {en.verifyEmail.missingToken}
        </p>
        <Link className="mt-6 inline-block underline" href="/login">
          {en.verifyEmail.backLogin}
        </Link>
      </main>
    );
  }

  const result = await verifyEmailWithToken(token);
  if (result.ok) {
    redirect("/login?verified=1");
  }

  const message =
    result.reason === "expired"
      ? en.verifyEmail.linkExpired
      : en.verifyEmail.linkInvalid;

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{en.verifyEmail.verificationFailed}</h1>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">{message}</p>
      <Link className="mt-6 inline-block underline" href="/login">
        {en.verifyEmail.backLogin}
      </Link>
    </main>
  );
}
