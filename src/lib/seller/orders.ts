import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { notifyOrderByEmail } from "@/lib/notifications/order-email";
import { Payment } from "@/models/Payment";

const allowedStatuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type AllowedStatus = (typeof allowedStatuses)[number];

export type SellerOrderRow = {
  id: string;
  status: string;
  paymentStatus: string;
  customerEmail: string;
  createdAt: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
};

function isAllowedStatus(status: string): status is AllowedStatus {
  return allowedStatuses.includes(status as AllowedStatus);
}

export async function sellerOwnsAnyOrderItem(
  sellerId: string,
  orderId: string,
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) return false;
  if (!mongoose.Types.ObjectId.isValid(orderId)) return false;
  await connectDB();
  const order = await Order.findById(orderId)
    .populate("items.productId", "sellerId")
    .select("items")
    .lean();
  if (!order) return false;
  const sid = sellerId.toString();
  const items = order.items as {
    productId?: { sellerId?: { toString(): string } | null } | null;
  }[];
  return items.some(
    (item) => item.productId?.sellerId?.toString() === sid,
  );
}

export async function listOrdersForSeller(
  sellerId: string,
  paidOnly = false,
): Promise<SellerOrderRow[]> {
  if (!mongoose.Types.ObjectId.isValid(sellerId)) return [];
  await connectDB();
  const docs = await Order.find(paidOnly ? { paymentStatus: "paid" } : {})
    .populate("items.productId", "sellerId")
    .sort({ createdAt: -1 })
    .lean();
  const paymentRows = await Payment.find({
    orderId: { $in: docs.map((d) => d._id) },
  })
    .select("orderId status")
    .lean();
  const paymentByOrder = new Map(
    paymentRows.map((p) => [p.orderId.toString(), p.status as string]),
  );
  const sid = sellerId.toString();
  return docs
    .map((order) => {
      const rawItems = order.items as {
        productId?: { _id?: { toString(): string }; sellerId?: { toString(): string } | null } | null;
        name: string;
        quantity: number;
        price: number;
      }[];
      const sellerItems = rawItems.filter(
        (item) => item.productId?.sellerId?.toString() === sid,
      );
      if (!sellerItems.length) return null;
      const shipping = order.shippingAddress as { email?: string } | undefined;
      return {
        id: order._id.toString(),
        status: order.status,
        paymentStatus:
          paymentByOrder.get(order._id.toString()) ??
          order.paymentStatus ??
          "unpaid",
        customerEmail: shipping?.email ?? "—",
        createdAt: (order.createdAt as Date).toISOString(),
        items: sellerItems.map((item) => ({
          productId: item.productId?._id?.toString() ?? "",
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };
    })
    .filter((row): row is SellerOrderRow => row !== null);
}

export async function updateOrderStatusWithRole(params: {
  orderId: string;
  status: string;
  actorRole: "admin" | "seller" | "customer";
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isAllowedStatus(params.status)) {
    return { ok: false, error: "Invalid status" };
  }
  if (!mongoose.Types.ObjectId.isValid(params.orderId)) {
    return { ok: false, error: "Invalid order id" };
  }
  await connectDB();
  const order = await Order.findById(params.orderId)
    .populate("items.productId", "sellerId")
    .select("items status shippedAt");
  if (!order) return { ok: false, error: "Order not found" };

  if (params.actorRole === "customer") {
    return { ok: false, error: "Forbidden" };
  }
  if (params.actorRole === "seller") {
    const sid = params.actorUserId.toString();
    const items = order.items as {
      productId?: { sellerId?: { toString(): string } | null } | null;
    }[];
    const ownsAny = items.some(
      (item) => item.productId?.sellerId?.toString() === sid,
    );
    if (!ownsAny) return { ok: false, error: "Forbidden" };
    if (!["confirmed", "shipped", "delivered"].includes(params.status)) {
      return { ok: false, error: "Forbidden status" };
    }
  }

  order.status = params.status;
  if (params.status === "shipped") {
    order.shippedAt = new Date();
  }
  if (params.status !== "shipped" && order.shippedAt) {
    order.shippedAt = null;
  }
  await order.save();
  await notifyOrderByEmail({
    orderId: params.orderId,
    event: "order_status_updated",
    status: params.status,
  });
  return { ok: true };
}
