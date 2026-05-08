"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import {
  updateSellerProfile,
  type SellerProfileActionState,
} from "@/seller/profile-actions";

export function SellerProfileForm({
  initial,
}: {
  initial: {
    sellerStoreName: string;
    sellerBio: string;
    sellerPayoutEmail: string;
    sellerProfileCompleted: boolean;
  };
}) {
  const [state, formAction] = useFormState<SellerProfileActionState, FormData>(
    updateSellerProfile,
    {},
  );
  return (
    <div>
      <h1 className="text-2xl font-semibold">Seller profile</h1>
      <p className="mt-2 text-sm text-muted">
        Complete your seller profile and payout contact details.
      </p>
      <form action={formAction} className="mt-8 grid max-w-xl gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>Store name</span>
          <input
            name="sellerStoreName"
            required
            defaultValue={initial.sellerStoreName}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Store bio</span>
          <textarea
            name="sellerBio"
            rows={4}
            defaultValue={initial.sellerBio}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Payout email</span>
          <input
            name="sellerPayoutEmail"
            type="email"
            required
            defaultValue={initial.sellerPayoutEmail}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-green-700">Saved.</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Save seller profile
          </button>
          <Link href="/seller" className="text-sm underline">
            Open seller dashboard
          </Link>
          {initial.sellerProfileCompleted ? (
            <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
              Profile complete
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
