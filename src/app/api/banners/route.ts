import { NextResponse } from "next/server";
import { listActiveBannersPublic } from "@/lib/admin/home-banners";

export const dynamic = "force-dynamic";

export async function GET() {
  const banners = await listActiveBannersPublic();
  return NextResponse.json({ banners });
}
