"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { z } from "zod";
import { authOptions } from "@/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import { Cart } from "@/models/Cart";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import {
  buildValidatedOrderItems,
  cartLineInput,
  linesFromMemberCart,
  mergeCartLines,
} from "@/lib/checkout/cart-order";
import { guestContactSchema } from "@/lib/checkout/contact-schema";
import { computeBreakdown } from "@/checkout/pricing";
import { checkoutErrors } from "@/lib/site-copy";
import { notifyOrderByEmail } from "@/lib/notifications/order-email";
import { upsertPaymentRecord } from "@/lib/payments/records";

export type CheckoutActionState = {
  error?: string;
  ok?: boolean;
  orderId?: string;
  confirmationToken?: string;
};

export type OrderConfirmationSnapshot = {
  id: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
};

async function decreaseStockForOrderItems(
  orderItems: { productId: mongoose.Types.ObjectId; quantity: number }[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const item of orderItems) {
    const before = await Product.findById(item.productId).select("name stock").lean();
    console.log("[checkout] stock before", {
      productId: item.productId.toString(),
      quantity: item.quantity,
      stock: before?.stock ?? null,
    });
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true },
    )
      .select("name stock")
      .lean();
    console.log("[checkout] stock after", {
      productId: item.productId.toString(),
      stock: updated?.stock ?? null,
    });
    if (!updated) {
      return { ok: false, error: checkoutErrors.productUnavailable };
    }
  }
  return { ok: true };
}

export async function getOrderConfirmation(
  orderId: unknown,
  token: unknown,
): Promise<OrderConfirmationSnapshot | null> {
  if (typeof orderId !== "string" || !mongoose.Types.ObjectId.isValid(orderId)) {
    return null;
  }
  if (typeof token !== "string" || token.length < 8) return null;
  await connectDB();
  const o = await Order.findOne({
    _id: orderId,
    confirmationToken: token,
  })
    .select("total items paymentMethod paymentStatus status")
    .lean();
  if (!o) return null;
  const items = o.items as { quantity: number }[];
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  return {
    id: o._id.toString(),
    total: o.total,
    itemCount,
    paymentMethod: o.paymentMethod ?? "cod",
    paymentStatus: o.paymentStatus ?? "pending",
    status: o.status,
  };
}

export async function submitCheckout(
  _prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void _prev;
  const paymentMethodRaw = formData.get("paymentMethod");
  const paymentMethod =
    paymentMethodRaw === "stripe"
      ? "stripe"
      : paymentMethodRaw === "paypal"
        ? "paypal"
        : "cod";

  if (paymentMethod === "stripe") {
    return { error: checkoutErrors.useStripeCheckout };
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isGuest = !userId;
  console.log("[checkout] submitCheckout user", { userId: userId ?? null, isGuest });

  let lines: { productId: string; quantity: number }[] = [];

  if (isGuest) {
    const cartJson = formData.get("cartJson");
    if (typeof cartJson !== "string" || !cartJson.trim()) {
      return { error: checkoutErrors.cartEmpty };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(cartJson) as unknown;
    } catch {
      return { error: checkoutErrors.invalidCartPayload };
    }
    const arr = z.array(cartLineInput).max(100).safeParse(parsed);
    if (!arr.success) return { error: checkoutErrors.invalidCartItems };
    lines = mergeCartLines(arr.data);
  } else if (userId) {
    lines = await linesFromMemberCart(userId);
  }

  const built = await buildValidatedOrderItems(lines);
  if (!built.ok) return { error: built.error };
  console.log("[checkout] order items", {
    count: built.orderItems.length,
    items: built.orderItems.map((item) => ({
      productId: item.productId.toString(),
      quantity: item.quantity,
      price: item.price,
    })),
  });

  const breakdown = computeBreakdown(built.subtotal, 0);

  const contactParsed = guestContactSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") ?? "",
    city: formData.get("city"),
    state: formData.get("state") ?? "",
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
  });
  if (!contactParsed.success) {
    return { error: checkoutErrors.completeShipping };
  }
  const contact = contactParsed.data;

  const confirmationToken = randomBytes(16).toString("hex");

  await connectDB();

  const orderDoc: Record<string, unknown> = {
    items: built.orderItems,
    subtotal: breakdown.subtotal,
    shipping: breakdown.shipping,
    tax: breakdown.tax,
    discount: breakdown.discount,
    total: breakdown.total,
    status: "pending",
    paymentMethod,
    paymentStatus: "pending",
    promoCodeApplied: "",
    confirmationToken,
  };

  orderDoc.shippingAddress = contact;
  if (userId) {
    orderDoc.userId = new mongoose.Types.ObjectId(userId);
  }

  const stockResult = await decreaseStockForOrderItems(
    built.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  );
  if (!stockResult.ok) {
    return { error: stockResult.error };
  }

  const order = await Order.create(orderDoc);
  console.log("[checkout] order created", {
    orderId: order._id.toString(),
    userId: userId ?? null,
    status: order.status,
  });
  await upsertPaymentRecord({
    orderId: order._id,
    userId: userId ?? null,
    method: "cod",
    status: "pending",
    amount: breakdown.total,
    currency: "usd",
    provider: "manual",
  });

  if (userId) {
    const cart = await Cart.findOne({ userId });
    console.log("[checkout] cart before clear", {
      userId,
      itemCount: cart?.items?.length ?? 0,
    });
    if (cart) {
      cart.items = [] as typeof cart.items;
      await cart.save();
    }
    const cartAfter = await Cart.findOne({ userId }).select("items").lean();
    console.log("[checkout] cart after clear", {
      userId,
      itemCount: cartAfter?.items?.length ?? 0,
    });
  }

  await notifyOrderByEmail({
    orderId: order._id.toString(),
    event: "order_placed",
  });

  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/products");

  return {
    ok: true,
    orderId: order._id.toString(),
    confirmationToken,
  };
}
