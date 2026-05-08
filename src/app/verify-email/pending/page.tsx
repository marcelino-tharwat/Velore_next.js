import Link from "next/link";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

function buildVerificationLink(token: string): string {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

export default async function VerifyPendingPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const rawEmail = searchParams.email;
  const emailAddr = rawEmail
    ? decodeURIComponent(rawEmail).toLowerCase()
    : "";

  let devVerificationLink: string | null = null;
  const showDevVerificationLink =
    process.env.MOCK_EMAIL_VERIFICATION !== "false" && Boolean(emailAddr);

  if (showDevVerificationLink && emailAddr) {
    await connectDB();
    const user = await User.findOne({ email: emailAddr }).select(
      "+verificationToken",
    );
    if (user?.verificationToken) {
      devVerificationLink = buildVerificationLink(user.verificationToken);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{en.verifyEmail.title}</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">
          {en.verifyEmail.sentTo}{" "}
          {emailAddr ? <strong>{emailAddr}</strong> : en.verifyEmail.yourAddress}
          . {en.verifyEmail.afterVerify}
        </p>
      </div>

      {devVerificationLink ? (
        <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            {en.verifyEmail.devTitle}
          </p>
          <p className="mt-2 break-all text-amber-900/90 dark:text-amber-50/90">
            {en.verifyEmail.devBody}{" "}
            <Link className="underline" href={devVerificationLink}>
              {devVerificationLink}
            </Link>
          </p>
        </section>
      ) : null}

      <p className="text-sm text-black/60 dark:text-white/60">
        <Link className="underline" href="/login">
          {en.verifyEmail.backLogin}
        </Link>
      </p>
    </main>
  );
}
