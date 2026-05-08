import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { listCategories } from "@/categories/queries";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";
import { ProductForm } from "@/components/product-form";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) redirect("/");
  const categories = await listCategories();
  if (!categories.length) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <p className="text-sm text-black/70 dark:text-white/70">
          {en.admin.needCategoryFirst}
        </p>
        <Link className="mt-4 inline-block underline" href="/admin/categories">
          {en.admin.manageCategories}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/admin/products"
        className="text-sm text-black/60 underline dark:text-white/60"
      >
        {en.admin.backToProductList}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{en.admin.newProductPageTitle}</h1>
      <div className="mt-8">
        <ProductForm categories={categories} />
      </div>
    </main>
  );
}
