"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addPaymentMethod, type PaymentActionState } from "@/account/payment-actions";
import { en } from "@/lib/site-copy";

function SubmitPayment() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? en.payment.saving : en.payment.save}
    </button>
  );
}

export function AddPaymentForm() {
  const [state, formAction] = useFormState<PaymentActionState, FormData>(
    addPaymentMethod,
    {},
  );

  return (
    <form
      action={formAction}
      className="grid max-w-md gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
    >
      <h2 className="text-sm font-medium">{en.payment.formTitle}</h2>
      <p className="text-xs text-black/55 dark:text-white/55">{en.payment.formIntro}</p>
      <label className="flex flex-col gap-1 text-xs">
        <span>{en.payment.label}</span>
        <input
          name="label"
          placeholder={en.payment.placeholderLabel}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span>{en.payment.brand}</span>
        <select
          name="brand"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        >
          <option value="Visa">Visa</option>
          <option value="Mastercard">Mastercard</option>
          <option value="Amex">Amex</option>
          <option value="Other">{en.payment.brandOther}</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span>{en.payment.last4}</span>
        <input
          name="last4"
          required
          pattern="\d{4}"
          maxLength={4}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span>{en.payment.expMonth}</span>
          <input
            name="expMonth"
            type="number"
            min={1}
            max={12}
            defaultValue={12}
            required
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span>{en.payment.expYear}</span>
          <input
            name="expYear"
            type="number"
            min={2026}
            defaultValue={2030}
            required
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
      </div>
      {state.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-xs text-green-700 dark:text-green-400">{en.payment.added}</p>
      ) : null}
      <SubmitPayment />
    </form>
  );
}
