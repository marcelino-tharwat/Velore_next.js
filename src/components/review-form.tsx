"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createReview, type ReviewActionState } from "@/account/review-actions";
import { en } from "@/lib/site-copy";

function SubmitReviewButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? en.reviewForm.submitting : en.reviewForm.submit}
    </button>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [state, formAction] = useFormState<ReviewActionState, FormData>(
    createReview,
    {},
  );

  return (
    <form action={formAction} className="mt-4 flex max-w-xl flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.reviewForm.rating}</span>
        <select
          name="rating"
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          defaultValue={5}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {en.reviewForm.starsWord}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.reviewForm.titleOptional}</span>
        <input
          name="title"
          type="text"
          maxLength={200}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.reviewForm.comment}</span>
        <textarea
          name="comment"
          rows={4}
          maxLength={5000}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">{en.reviewForm.thanks}</p>
      ) : null}
      <SubmitReviewButton />
    </form>
  );
}
