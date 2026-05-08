"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  addToCart,
  type CartActionState,
} from "@/cart/actions";
import { emitCartRefresh } from "@/lib/cart-events";
import { useGuestCartStore } from "@/stores/guest-cart-store";
import { en } from "@/lib/site-copy";

export type ProductCartSnapshot = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  stock: number;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary px-4 py-2 disabled:opacity-60"
    >
      {pending ? en.cart.adding : label}
    </button>
  );
}

function GuestAddToCart({ snapshot }: { snapshot: ProductCartSnapshot }) {
  const addLine = useGuestCartStore((s) => s.addLine);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (snapshot.stock < 1) return;
    const q = Math.min(Math.max(1, qty), snapshot.stock, 99);
    addLine(
      {
        productId: snapshot.id,
        name: snapshot.name,
        slug: snapshot.slug,
        price: snapshot.price,
        imageUrl: snapshot.imageUrl,
        quantity: q,
      },
      snapshot.stock,
    );
    setMsg(en.cart.addedToCart);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.cart.quantity}</span>
        <input
          type="number"
          min={1}
          max={Math.min(snapshot.stock, 99)}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value) || 1)}
          className="w-24 rounded-md border border-input bg-background px-3 py-2"
        />
      </label>
      <button
        type="submit"
        className="btn-primary px-4 py-2"
      >
        {en.cart.addToCart}
      </button>
      {msg ? (
        <p className="text-sm text-green-700 dark:text-green-400 sm:ms-2">
          {msg}
        </p>
      ) : null}
    </form>
  );
}

export function AddToCartForm({ snapshot }: { snapshot: ProductCartSnapshot }) {
  const { data: session, status } = useSession();
  const [state, formAction] = useFormState<CartActionState, FormData>(
    addToCart,
    {},
  );
  const prevOk = useRef(false);

  useEffect(() => {
    if (state.ok && !prevOk.current && session?.user) {
      emitCartRefresh();
    }
    prevOk.current = !!state.ok;
  }, [state.ok, session?.user]);

  if (status === "loading") {
    return (
      <p className="text-sm text-muted">{en.checkout.loading}</p>
    );
  }

  if (!session?.user) {
    return <GuestAddToCart snapshot={snapshot} />;
  }

  if (snapshot.stock === 0) {
    return (
      <p className="text-sm text-muted">
        {en.productDetail.outOfStock}
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="productId" value={snapshot.id} />
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.cart.quantity}</span>
        <input
          name="quantity"
          type="number"
          min={1}
          max={Math.min(snapshot.stock, 99)}
          defaultValue={1}
          className="w-24 rounded-md border border-input bg-background px-3 py-2"
        />
      </label>
      <SubmitButton label={en.cart.addToCart} />
      {state.error ? (
        <p
          className="text-sm text-red-600 dark:text-red-400 sm:ms-2"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
