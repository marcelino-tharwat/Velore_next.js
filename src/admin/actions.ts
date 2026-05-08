"use server";

import { getServerSession } from "next-auth/next";
import { connectDB } from "@/lib/db/mongoose";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { authOptions } from "@/auth/options";
import { isAdmin } from "@/lib/auth/roles";

export type AdminStats = {
  users: number;
  products: number;
  categories: number;
  orders: number;
  revenuePending: number;
};

export async function getAdminStats(): Promise<AdminStats | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) return null;
  await connectDB();
  const [users, products, categories, orders, pendingAgg] = await Promise.all([
    User.countDocuments({ deletedAt: null }),
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    Order.aggregate<{ total: number }>([
      { $match: { status: "pending" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);
  const revenuePending = pendingAgg[0]?.total ?? 0;
  return { users, products, categories, orders, revenuePending };
}
