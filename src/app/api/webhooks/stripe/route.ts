import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillPendingStripeOrder } from "@/lib/checkout/fulfill-stripe-order";
import { getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = headers().get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!whSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const pendingId =
      session.metadata?.pendingCheckoutId ??
      session.client_reference_id ??
      "";
    const amountTotal = session.amount_total ?? 0;

    const result = await fulfillPendingStripeOrder({
      stripeSessionId: session.id,
      pendingCheckoutId: pendingId,
      amountTotalCents: amountTotal,
    });

    if (!result.ok) {
      console.error("Fulfillment failed:", result.error);
      return NextResponse.json({ received: true, error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
