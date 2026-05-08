"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  updateProfile,
  type ProfileActionState,
} from "@/account/profile-actions";
import { en } from "@/lib/site-copy";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? en.profileForm.saving : en.profileForm.save}
    </button>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}) {
  const [state, formAction] = useFormState<ProfileActionState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="grid max-w-xl gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.profileForm.displayName}</span>
        <input
          name="name"
          type="text"
          defaultValue={initial.name}
          maxLength={120}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.profileForm.phone}</span>
        <input
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          maxLength={40}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.profileForm.address1}</span>
        <input
          name="addressLine1"
          type="text"
          defaultValue={initial.addressLine1}
          maxLength={200}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.profileForm.address2}</span>
        <input
          name="addressLine2"
          type="text"
          defaultValue={initial.addressLine2}
          maxLength={200}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.profileForm.city}</span>
          <input
            name="city"
            type="text"
            defaultValue={initial.city}
            maxLength={100}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.profileForm.state}</span>
          <input
            name="state"
            type="text"
            defaultValue={initial.state}
            maxLength={100}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.profileForm.postal}</span>
          <input
            name="postalCode"
            type="text"
            defaultValue={initial.postalCode}
            maxLength={30}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.profileForm.country}</span>
          <input
            name="country"
            type="text"
            defaultValue={initial.country}
            maxLength={100}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
      </div>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">{en.profileForm.saved}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
