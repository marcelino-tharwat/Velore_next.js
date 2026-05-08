"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createProduct,
  updateProduct,
  type ProductActionState,
} from "@/products/actions";
import type { ProductStaffItem } from "@/products/queries";
import { en } from "@/lib/site-copy";

type CategoryOption = { id: string; name: string; slug: string };

function SubmitProduct({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? en.productForm.saving : label}
    </button>
  );
}

export function ProductForm({
  categories,
  product,
}: {
  categories: CategoryOption[];
  product?: ProductStaffItem;
}) {
  const isEdit = Boolean(product);
  const [state, formAction] = useFormState<ProductActionState, FormData>(
    isEdit ? updateProduct : createProduct,
    {},
  );

  const imagesDefault = product?.images?.length
    ? product.images.join("\n")
    : product?.imageUrl ?? "";

  return (
    <form action={formAction} className="grid max-w-xl gap-3">
      {isEdit ? <input type="hidden" name="id" value={product!.id} /> : null}
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.productForm.name}</span>
        <input
          name="name"
          required
          defaultValue={product?.name}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.productForm.slug}</span>
        <input
          name="slug"
          defaultValue={product?.slug}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.productForm.category}</span>
        <select
          name="categoryId"
          required
          defaultValue={product?.category?.id ?? ""}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        >
          <option value="" disabled>
            {en.productForm.selectCategory}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.productForm.description}</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.productForm.price}</span>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={product?.price}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{en.productForm.stock}</span>
          <input
            name="stock"
            type="number"
            min={0}
            required
            defaultValue={product?.stock ?? 0}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span>{en.productForm.images}</span>
        <textarea
          name="images"
          rows={4}
          defaultValue={imagesDefault}
          placeholder={en.productForm.imagePlaceholder}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 font-mono text-xs dark:border-white/20"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">{en.productForm.saved}</p>
      ) : null}
      <SubmitProduct
        label={isEdit ? en.productForm.update : en.productForm.create}
      />
    </form>
  );
}
