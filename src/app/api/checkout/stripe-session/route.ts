import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/auth/options";
import { connectDB } from "@/lib/db/mongoose";
import {
  buildValidatedOrderItems,
  cartLineInput,
  linesFromMemberCart,
  mergeCartLines,
} from "@/lib/checkout/cart-order";
import { guestContactSchema } from "@/lib/checkout/contact-schema";
import { buildStripeCheckoutLineItems } from "@/lib/checkout/stripe-line-items";
import { computeBreakdown } from "@/checkout/pricing";
import { checkoutErrors } from "@/lib/site-copy";
import { PendingCheckout } from "@/models/PendingCheckout";
import { getStripe } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

const stripeCheckoutBodySchema = guestContactSchema.extend({
  cartJson: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsedBody = stripeCheckoutBodySchema.safeParse(json);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: checkoutErrors.completeShipping },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    let lines: { productId: string; quantity: number }[] = [];
    if (!userId) {
      const cartJson = parsedBody.data.cartJson;
      if (!cartJson?.trim()) {
        return NextResponse.json({ error: checkoutErrors.cartEmpty }, { status: 400 });
      }
      let raw: unknown;
      try {
        raw = JSON.parse(cartJson);
      } catch {
        return NextResponse.json(
          { error: checkoutErrors.invalidCartPayload },
          { status: 400 },
        );
      }
      const arr = z.array(cartLineInput).max(100).safeParse(raw);
      if (!arr.success) {
        return NextResponse.json(
          { error: checkoutErrors.invalidCartItems },
          { status: 400 },
        );
      }
      lines = mergeCartLines(arr.data);
    } else {
      lines = await linesFromMemberCart(userId);
    }

    const built = await buildValidatedOrderItems(lines);
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: 400 });
    }

    const breakdown = computeBreakdown(built.subtotal, 0);
    const contact = guestContactSchema.parse(parsedBody.data);

    const confirmationToken = randomBytes(16).toString("hex");
    await connectDB();

    const pending = await PendingCheckout.create({
      userId: userId ? userId : undefined,
      shippingAddress: contact,
      items: built.orderItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: breakdown.subtotal,
      shipping: breakdown.shipping,
      tax: breakdown.tax,
      discount: breakdown.discount,
      total: breakdown.total,
      promoCodeApplied: "",
      confirmationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "pending",
    });

    const stripe = getStripe();
    const lineItems = buildStripeCheckoutLineItems(
      built.orderItems,
      built.subtotal,
      breakdown,
    );

    const origin =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
      (typeof process.env.VERCEL_URL === "string"
        ? `https://${process.env.VERCEL_URL}`
        : new URL(req.url).origin);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/stripe-cancel`,
      customer_email: contact.email,
      client_reference_id: pending._id.toString(),
      metadata: {
        pendingCheckoutId: pending._id.toString(),
      },
      payment_intent_data: {
        metadata: {
          pendingCheckoutId: pending._id.toString(),
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 },
      );
    }

    pending.stripeSessionId = checkoutSession.id;
    await pending.save();

    return NextResponse.json({ url: checkoutSession.url });
  } catch (e) {
    console.error("stripe-session", e);
    return NextResponse.json(
      { error: "Could not start payment. Check STRIPE_SECRET_KEY and try again." },
      { status: 500 },
    );
  }
}
