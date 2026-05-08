import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { softDeleteProductFromForm } from "@/products/actions";
import { listProductsForSeller } from "@/products/queries";
import { authOptions } from "@/auth/options";
import { normalizeRole } from "@/lib/auth/roles";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || normalizeRole(session.user.role) !== "seller") redirect("/");
  const products = await listProductsForSeller(session.user.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{en.admin.pageProductsTitle}</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {en.admin.sellerProductsIntro}
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          {en.admin.newProduct}
        </Link>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/10">
            <th className="py-2 pr-4 font-medium">{en.admin.thProductName}</th>
            <th className="py-2 pr-4 font-medium">{en.admin.thProductCategory}</th>
            <th className="py-2 pr-4 font-medium">{en.admin.thProductPrice}</th>
            <th className="py-2 pr-4 font-medium">{en.admin.thStock}</th>
            <th className="py-2 pr-4 font-medium">{en.admin.thActive}</th>
            <th className="py-2 font-medium">{en.admin.thActions}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              className="border-b border-black/5 dark:border-white/5"
            >
              <td className="py-3 pr-4">
                <Link className="underline" href={`/products/${p.slug}`}>
                  {p.name}
                </Link>
              </td>
              <td className="py-3 pr-4 text-black/70 dark:text-white/70">
                {p.category?.name ?? "—"}
              </td>
              <td className="py-3 pr-4">${p.price.toFixed(2)}</td>
              <td className="py-3 pr-4">{p.stock}</td>
              <td className="py-3 pr-4">{p.isActive ? en.admin.yes : en.admin.no}</td>
              <td className="py-3">
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="text-black/70 underline dark:text-white/70"
                    href={`/seller/products/${p.id}/edit`}
                  >
                    {en.admin.edit}
                  </Link>
                  {p.isActive ? (
                    <form action={softDeleteProductFromForm}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="redirectTo" value="/seller/products" />
                      <button
                        type="submit"
                        className="text-red-600 underline dark:text-red-400"
                      >
                        {en.admin.deactivate}
                      </button>
                    </form>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 ? (
        <p className="mt-6 text-sm text-black/60 dark:text-white/60">
          {en.admin.noProductsYet}
        </p>
      ) : null}
    </main>
  );
}
