import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";

export type AdminSellerStatsRow = {
  id: string;
  email: string;
  name: string;
  banned: boolean;
  deleted: boolean;
  sellerStoreName: string;
  sellerPayoutEmail: string;
  sellerProfileCompleted: boolean;
  productCount: number;
  activeProductCount: number;
  totalStock: number;
  orderCount: number;
  paidOrderCount: number;
  unitsSold: number;
  grossRevenue: number;
  paidRevenue: number;
  createdAt: string;
};

export type SellerStatsRange = "7d" | "30d" | "90d" | "all";

type ProductAgg = {
  _id: mongoose.Types.ObjectId;
  productCount: number;
  activeProductCount: number;
  totalStock: number;
};

type OrderAgg = {
  _id: mongoose.Types.ObjectId;
  orderIds: mongoose.Types.ObjectId[];
  paidOrderIds: mongoose.Types.ObjectId[];
  unitsSold: number;
  grossRevenue: number;
  paidRevenue: number;
};

function rangeStartDate(range: SellerStatsRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function listSellerStatsForAdmin(opts?: {
  limit?: number;
  range?: SellerStatsRange;
  search?: string;
}): Promise<AdminSellerStatsRow[]> {
  await connectDB();
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 500);
  const range = opts?.range ?? "all";
  const search = (opts?.search ?? "").trim();
  const createdAfter = rangeStartDate(range);

  const sellerFilter: Record<string, unknown> = { role: "seller" };
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    sellerFilter.$or = [
      { email: new RegExp(safe, "i") },
      { sellerStoreName: new RegExp(safe, "i") },
    ];
  }

  const sellers = await User.find(sellerFilter)
    .select(
      "email name bannedAt deletedAt sellerStoreName sellerPayoutEmail sellerProfileCompleted createdAt",
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const sellerIds = sellers.map((s) => s._id);
  if (!sellerIds.length) return [];

  const [productAgg, orderAgg] = await Promise.all([
    Product.aggregate<ProductAgg>([
      { $match: { sellerId: { $in: sellerIds } } },
      {
        $group: {
          _id: "$sellerId",
          productCount: { $sum: 1 },
          activeProductCount: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          totalStock: { $sum: { $ifNull: ["$stock", 0] } },
        },
      },
    ]),
    Order.aggregate<OrderAgg>([
      ...(createdAfter ? [{ $match: { createdAt: { $gte: createdAfter } } }] : []),
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      { $unwind: "$productDoc" },
      { $match: { "productDoc.sellerId": { $in: sellerIds } } },
      {
        $group: {
          _id: "$productDoc.sellerId",
          orderIds: { $addToSet: "$_id" },
          paidOrderIds: {
            $addToSet: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$_id", null],
            },
          },
          unitsSold: { $sum: "$items.quantity" },
          grossRevenue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.price", 0] },
                { $ifNull: ["$items.quantity", 0] },
              ],
            },
          },
          paidRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "paid"] },
                {
                  $multiply: [
                    { $ifNull: ["$items.price", 0] },
                    { $ifNull: ["$items.quantity", 0] },
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const productMap = new Map(productAgg.map((p) => [p._id.toString(), p]));
  const orderMap = new Map(orderAgg.map((o) => [o._id.toString(), o]));

  return sellers.map((s) => {
    const key = s._id.toString();
    const p = productMap.get(key);
    const o = orderMap.get(key);
    const paidOrderIds = (o?.paidOrderIds ?? []).filter(
      (id): id is mongoose.Types.ObjectId => id !== null,
    );
    return {
      id: key,
      email: s.email,
      name: s.name ?? "",
      banned: Boolean(s.bannedAt),
      deleted: Boolean(s.deletedAt),
      sellerStoreName: s.sellerStoreName ?? "",
      sellerPayoutEmail: s.sellerPayoutEmail ?? "",
      sellerProfileCompleted: Boolean(s.sellerProfileCompleted),
      productCount: p?.productCount ?? 0,
      activeProductCount: p?.activeProductCount ?? 0,
      totalStock: p?.totalStock ?? 0,
      orderCount: o?.orderIds?.length ?? 0,
      paidOrderCount: paidOrderIds.length,
      unitsSold: o?.unitsSold ?? 0,
      grossRevenue: o?.grossRevenue ?? 0,
      paidRevenue: o?.paidRevenue ?? 0,
      createdAt: (s.createdAt as Date).toISOString(),
    };
  });
}
