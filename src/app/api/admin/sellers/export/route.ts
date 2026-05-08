import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import {
  listSellerStatsForAdmin,
  type SellerStatsRange,
} from "@/lib/admin/sellers";

export const dynamic = "force-dynamic";

function asCsvCell(v: string | number | boolean): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const rangeRaw = url.searchParams.get("range") ?? "all";
  const range: SellerStatsRange =
    rangeRaw === "7d" || rangeRaw === "30d" || rangeRaw === "90d"
      ? rangeRaw
      : "all";
  const q = (url.searchParams.get("q") ?? "").trim();

  const rows = await listSellerStatsForAdmin({
    limit: 500,
    range,
    search: q,
  });

  const headers = [
    "sellerId",
    "email",
    "name",
    "storeName",
    "payoutEmail",
    "profileCompleted",
    "banned",
    "deleted",
    "productCount",
    "activeProductCount",
    "totalStock",
    "orderCount",
    "paidOrderCount",
    "unitsSold",
    "grossRevenue",
    "paidRevenue",
    "createdAt",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.email,
        r.name,
        r.sellerStoreName,
        r.sellerPayoutEmail,
        r.sellerProfileCompleted,
        r.banned,
        r.deleted,
        r.productCount,
        r.activeProductCount,
        r.totalStock,
        r.orderCount,
        r.paidOrderCount,
        r.unitsSold,
        r.grossRevenue.toFixed(2),
        r.paidRevenue.toFixed(2),
        r.createdAt,
      ]
        .map(asCsvCell)
        .join(","),
    ),
  ];

  const filename = `seller-stats-${range}.csv`;
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
