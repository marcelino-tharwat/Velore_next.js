import { Order } from "@/models/Order";

type OrderEmailEvent = "order_placed" | "order_status_updated";

export async function notifyOrderByEmail(params: {
  orderId: string;
  event: OrderEmailEvent;
  status?: string;
}): Promise<void> {
  const order = await Order.findById(params.orderId)
    .select("_id total status paymentMethod paymentStatus shippingAddress")
    .lean();
  if (!order) return;

  const email = (order.shippingAddress as { email?: string } | undefined)?.email?.trim();
  if (!email) {
    console.info(
      "[order-email] skipped: missing email",
      JSON.stringify({ orderId: params.orderId, event: params.event }),
    );
    return;
  }

  const payload = {
    event: params.event,
    to: email,
    orderId: order._id.toString(),
    status: params.status ?? order.status,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  };

  const webhook = process.env.ORDER_EMAIL_WEBHOOK_URL?.trim();
  if (!webhook) {
    // Fallback for environments without email provider wiring.
    console.info("[order-email] preview", JSON.stringify(payload));
    return;
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ORDER_EMAIL_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.ORDER_EMAIL_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(
        "[order-email] webhook failed",
        JSON.stringify({ status: res.status, orderId: payload.orderId }),
      );
    }
  } catch (error) {
    console.error("[order-email] webhook error", error);
  }
}
