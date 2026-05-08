import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/mongoose";
import { Cart } from "@/models/Cart";
import { Order } from "@/models/Order";
import { PendingCheckout } from "@/models/PendingCheckout";
import { Product } from "@/models/Product";
import { notifyOrderByEmail } from "@/lib/notifications/order-email";
import { upsertPaymentRecord } from "@/lib/payments/records";

type PendingLine = {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
};

async function decreaseStockForOrderItems(
  items: { productId: mongoose.Types.ObjectId; quantity: number }[],
): Promise<boolean> {
  for (const row of items) {
    const before = await Product.findById(row.productId).select("stock").lean();
    console.log("[stripe-fulfill] stock before", {
      productId: row.productId.toString(),
      quantity: row.quantity,
      stock: before?.stock ?? null,
    });
    const updated = await Product.findOneAndUpdate(
      { _id: row.productId, stock: { $gte: row.quantity } },
      { $inc: { stock: -row.quantity } },
      { new: true },
    )
      .select("stock")
      .lean();
    console.log("[stripe-fulfill] stock after", {
      productId: row.productId.toString(),
      stock: updated?.stock ?? null,
    });
    if (!updated) return false;
  }
  return true;
}

export async function fulfillPendingStripeOrder(params: {
  stripeSessionId: string;
  pendingCheckoutId: string;
  amountTotalCents: number;
}): Promise<
  | { ok: true; orderId: string; confirmationToken: string; duplicate?: boolean }
  | { ok: false; error: string }
> {
  await connectDB();

  const existing = await Order.findOne({
    stripeCheckoutSessionId: params.stripeSessionId,
  }).lean();
  if (existing) {
    return {
      ok: true,
      orderId: existing._id.toString(),
      confirmationToken: existing.confirmationToken ?? "",
      duplicate: true,
    };
  }

  if (!mongoose.Types.ObjectId.isValid(params.pendingCheckoutId)) {
    return { ok: false, error: "invalid_pending" };
  }

  const pending = await PendingCheckout.findById(params.pendingCheckoutId);
  if (!pending || pending.status !== "pending") {
    return { ok: false, error: "pending_missing" };
  }
  console.log("[stripe-fulfill] pending user", {
    pendingCheckoutId: params.pendingCheckoutId,
    userId: pending.userId ? pending.userId.toString() : null,
  });
  console.log("[stripe-fulfill] order items", {
    count: pending.items.length,
    items: pending.items.map((item: PendingLine) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
      price: item.price,
    })),
  });

  const expectedCents = Math.round(pending.total * 100);
  if (Math.abs(params.amountTotalCents - expectedCents) > 1) {
    return { ok: false, error: "amount_mismatch" };
  }

  for (const row of pending.items) {
    const p = await Product.findById(row.productId);
    if (!p || p.stock < row.quantity) {
      return { ok: false, error: "stock_changed" };
    }
  }

  const orderDoc: Record<string, unknown> = {
    items: pending.items,
    subtotal: pending.subtotal,
    shipping: pending.shipping,
    tax: pending.tax,
    discount: pending.discount,
    total: pending.total,
    status: "confirmed",
    paymentMethod: "stripe",
    paymentStatus: "paid",
    stripeCheckoutSessionId: params.stripeSessionId,
    promoCodeApplied: pending.promoCodeApplied ?? "",
    confirmationToken: pending.confirmationToken,
    shippingAddress: pending.shippingAddress,
  };
  if (pending.userId) {
    orderDoc.userId = pending.userId;
  }

  const stockReduced = await decreaseStockForOrderItems(
    pending.items.map((item: PendingLine) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  );
  if (!stockReduced) {
    return { ok: false, error: "stock_changed" };
  }

  const order = await Order.create(orderDoc);
  console.log("[stripe-fulfill] order created", {
    orderId: order._id.toString(),
    userId: pending.userId ? pending.userId.toString() : null,
    status: order.status,
  });
  await upsertPaymentRecord({
    orderId: order._id,
    userId: pending.userId ?? null,
    method: "stripe",
    status: "paid",
    amount: pending.total,
    currency: "usd",
    transactionId: params.stripeSessionId,
    provider: "stripe",
    providerSessionId: params.stripeSessionId,
  });

  if (pending.userId) {
    const cart = await Cart.findOne({ userId: pending.userId });
    console.log("[stripe-fulfill] cart before clear", {
      userId: pending.userId.toString(),
      itemCount: cart?.items?.length ?? 0,
    });
    if (cart) {
      cart.items = [] as typeof cart.items;
      await cart.save();
    }
    const cartAfter = await Cart.findOne({ userId: pending.userId }).select("items").lean();
    console.log("[stripe-fulfill] cart after clear", {
      userId: pending.userId.toString(),
      itemCount: cartAfter?.items?.length ?? 0,
    });
  }

  await notifyOrderByEmail({
    orderId: order._id.toString(),
    event: "order_placed",
  });

  pending.status = "completed";
  await pending.save();

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/products");
  revalidatePath("/admin/orders");

  return {
    ok: true,
    orderId: order._id.toString(),
    confirmationToken: pending.confirmationToken,
  };
}
