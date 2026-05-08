import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { deleteCategoryFromForm } from "@/categories/actions";
import { listCategories } from "@/categories/queries";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";
import { CategoryCreateForm } from "@/components/category-create-form";
import { en } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) redirect("/");
  const categories = await listCategories();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{en.admin.pageCategoriesTitle}</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {en.admin.categoriesIntro}
          </p>
        </div>
        <Link href="/admin/products" className="text-sm underline">
          {en.admin.backToProducts}
        </Link>
      </div>
      <div className="mt-8">
        <CategoryCreateForm />
      </div>
      <ul className="mt-10 divide-y divide-black/10 dark:divide-white/10">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-black/50 dark:text-white/50">
                /{c.slug}
              </p>
              {c.description ? (
                <p className="mt-1 text-sm text-black/65 dark:text-white/65">
                  {c.description}
                </p>
              ) : null}
            </div>
            <form action={deleteCategoryFromForm}>
              <input type="hidden" name="id" value={c.id} />
              <button
                type="submit"
                className="text-sm text-red-600 underline dark:text-red-400"
              >
                Delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
