import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { listCategories } from "@/categories/queries";
import { getProductStaffById } from "@/products/queries";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";
import { ProductForm } from "@/components/product-form";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) redirect("/");
  const [product, categories] = await Promise.all([
    getProductStaffById(params.id),
    listCategories(),
  ]);
  if (!product) notFound();
  if (!categories.length) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <p className="text-sm">{en.admin.noCategoriesShort}</p>
        <Link className="mt-2 underline" href="/admin/categories">
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
      <h1 className="mt-4 text-2xl font-semibold">{en.admin.editProductPageTitle}</h1>
      <div className="mt-8">
        <ProductForm categories={categories} product={product} />
      </div>
    </main>
  );
}
