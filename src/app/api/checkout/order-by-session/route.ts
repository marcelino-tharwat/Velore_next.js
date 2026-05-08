import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Order } from "@/models/Order";

export const dynamic = "force-dynamic";

/** Poll after Stripe redirect until webhook creates the order. */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId?.trim()) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  await connectDB();
  const order = await Order.findOne({ stripeCheckoutSessionId: sessionId.trim() })
    .select("_id confirmationToken")
    .lean();

  if (!order) {
    return NextResponse.json({ pending: true as const });
  }

  return NextResponse.json({
    pending: false as const,
    orderId: order._id.toString(),
    confirmationToken: order.confirmationToken ?? "",
  });
}
