import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { listPaymentMethods } from "@/account/queries";
import {
  deletePaymentMethodFromForm,
  setDefaultPaymentMethodFromForm,
} from "@/account/payment-actions";
import { authOptions } from "@/auth/options";
import { AddPaymentForm } from "@/components/add-payment-form";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AccountPaymentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/payment");
  const methods = await listPaymentMethods(session.user.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{en.payment.pageTitle}</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {en.payment.pageIntro}
      </p>

      <div className="mt-8">
        <AddPaymentForm />
      </div>

      <ul className="mt-10 divide-y divide-black/10 dark:divide-white/10">
        {methods.length === 0 ? (
          <li className="py-4 text-sm text-black/60 dark:text-white/60">
            {en.payment.noMethods}
          </li>
        ) : (
          methods.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="font-medium">
                  {m.brand} ·••• {m.last4}
                  {m.isDefault ? (
                    <span className="ms-2 rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/15">
                      {en.payment.defaultBadge}
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {m.label} · {en.payment.expiresIn} {m.expMonth}/{m.expYear}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!m.isDefault ? (
                  <form action={setDefaultPaymentMethodFromForm}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="text-sm text-black/70 underline-offset-4 hover:underline dark:text-white/70"
                    >
                      {en.payment.setDefault}
                    </button>
                  </form>
                ) : null}
                <form action={deletePaymentMethodFromForm}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="text-sm text-red-600 underline-offset-4 hover:underline dark:text-red-400"
                  >
                    {en.payment.remove}
                  </button>
                </form>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
