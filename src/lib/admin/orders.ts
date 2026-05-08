import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";

export type AdminOrderRow = {
  id: string;
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  customerEmail: string;
  itemCount: number;
  trackingNumber?: string;
  /** Payment document id when a payment row exists for this order */
  paymentId?: string;
  paymentTransactionId?: string;
  paymentFailureReason?: string;
  paymentCurrency?: string;
  paymentProvider?: string;
  paymentProviderSessionId?: string;
};

export async function listOrdersForAdmin(limit = 80): Promise<AdminOrderRow[]> {
  await connectDB();
  const docs = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 200))
    .lean();
  const paymentRows = await Payment.find({
    orderId: { $in: docs.map((d) => d._id) },
  })
    .select(
      "orderId status method transactionId failureReason currency provider providerSessionId",
    )
    .lean();
  const paymentByOrder = new Map(
    paymentRows.map((p) => [p.orderId.toString(), p]),
  );

  return docs.map((o) => {
    const payment = paymentByOrder.get(o._id.toString()) as
      | {
          _id: mongoose.Types.ObjectId;
          method?: string;
          status?: string;
          transactionId?: string;
          failureReason?: string;
          currency?: string;
          provider?: string;
          providerSessionId?: string;
        }
      | undefined;
    const items = o.items as { quantity: number }[];
    const itemCount = items.reduce((n, i) => n + i.quantity, 0);
    const ship = o.shippingAddress as { email?: string } | undefined;
    return {
      id: o._id.toString(),
      total: o.total,
      status: o.status,
      paymentMethod: (payment?.method as string | undefined) ?? o.paymentMethod,
      paymentStatus: (payment?.status as string | undefined) ?? o.paymentStatus,
      createdAt: (o.createdAt as Date).toISOString(),
      customerEmail: ship?.email ?? "—",
      itemCount,
      trackingNumber: o.trackingNumber || "",
      paymentId: payment?._id?.toString(),
      paymentTransactionId: payment?.transactionId,
      paymentFailureReason: payment?.failureReason,
      paymentCurrency: payment?.currency,
      paymentProvider: payment?.provider,
      paymentProviderSessionId: payment?.providerSessionId,
    };
  });
}

export type AdminOrderDetail = AdminOrderRow & {
  subtotal?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  items: { name: string; price: number; quantity: number }[];
  adminNotes?: string;
  shippedAt: string | null;
};

export async function getOrderForAdmin(
  orderId: string,
): Promise<AdminOrderDetail | null> {
  if (!mongoose.Types.ObjectId.isValid(orderId)) return null;
  await connectDB();
  const o = await Order.findById(orderId).lean();
  if (!o) return null;
  const payment = await Payment.findOne({ orderId: o._id })
    .select("status method")
    .lean();
  const items = (o.items as { name: string; price: number; quantity: number }[]).map(
    (i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }),
  );
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const ship = o.shippingAddress as { email?: string } | undefined;
  return {
    id: o._id.toString(),
    total: o.total,
    status: o.status,
    paymentMethod: (payment?.method as string | undefined) ?? o.paymentMethod,
    paymentStatus: (payment?.status as string | undefined) ?? o.paymentStatus,
    createdAt: (o.createdAt as Date).toISOString(),
    customerEmail: ship?.email ?? "—",
    itemCount,
    trackingNumber: o.trackingNumber || "",
    subtotal: o.subtotal ?? undefined,
    shipping: o.shipping ?? undefined,
    tax: o.tax ?? undefined,
    discount: o.discount ?? undefined,
    items,
    adminNotes: o.adminNotes || "",
    shippedAt: o.shippedAt ? (o.shippedAt as Date).toISOString() : null,
  };
}

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export async function updateOrderAdmin(
  orderId: string,
  patch: {
    status?: (typeof orderStatuses)[number];
    trackingNumber?: string;
    adminNotes?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { ok: false, error: "Invalid order id" };
  }
  await connectDB();
  const o = await Order.findById(orderId);
  if (!o) return { ok: false, error: "Order not found" };
  if (patch.status) {
    if (!orderStatuses.includes(patch.status)) {
      return { ok: false, error: "Invalid status" };
    }
    o.status = patch.status;
    if (patch.status === "shipped") {
      o.shippedAt = new Date();
    }
    if (patch.status !== "shipped" && o.shippedAt) {
      o.shippedAt = null;
    }
  }
  if (patch.trackingNumber !== undefined) {
    o.trackingNumber = patch.trackingNumber.slice(0, 200);
  }
  if (patch.adminNotes !== undefined) {
    o.adminNotes = patch.adminNotes.slice(0, 5000);
  }
  await o.save();
  return { ok: true };
}
