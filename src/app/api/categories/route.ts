import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { listCategories } from "@/categories/queries";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json({ categories });
}

const postSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const slug =
    d.slug && d.slug.trim().length ? slugify(d.slug) : slugify(d.name);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  await connectDB();
  try {
    const doc = await Category.create({
      name: d.name.trim(),
      slug,
      description: d.description?.trim() ?? "",
    });
    return NextResponse.json(
      {
        category: {
          id: doc._id.toString(),
          name: doc.name,
          slug: doc.slug,
          description: doc.description,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Slug may exist" }, { status: 409 });
  }
}
