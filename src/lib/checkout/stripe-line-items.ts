import type Stripe from "stripe";
import type { OrderItemBuild } from "@/lib/checkout/cart-order";
import type { PriceBreakdown } from "@/checkout/pricing";

/** Stripe v22: use session create params from the client API (avoids `Stripe.Checkout` vs resource class ambiguity). */
type StripeCheckoutLineItem = NonNullable<
  NonNullable<
    Parameters<
      InstanceType<typeof Stripe>["checkout"]["sessions"]["create"]
    >[0]
  >["line_items"]
>[number];

/**
 * Builds Stripe Checkout line items: discounted product totals (one line per SKU),
 * plus shipping and tax lines. Amounts match {@link PriceBreakdown.total} in cents.
 */
export function buildStripeCheckoutLineItems(
  orderItems: OrderItemBuild[],
  subtotal: number,
  breakdown: PriceBreakdown,
): StripeCheckoutLineItem[] {
  const targetCents = Math.round(breakdown.taxableSubtotal * 100);
  let allocated = 0;
  const lines: StripeCheckoutLineItem[] = [];

  orderItems.forEach((it, index) => {
    const isLast = index === orderItems.length - 1;
    const lineValue = it.price * it.quantity;
    const lineCents = isLast
      ? targetCents - allocated
      : Math.round((lineValue / subtotal) * targetCents);
    if (!isLast) allocated += lineCents;

    lines.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: lineCents,
        product_data: {
          name: `${it.name} (×${it.quantity})`,
          metadata: {
            productId: it.productId.toString(),
            quantity: String(it.quantity),
          },
        },
      },
    });
  });

  if (breakdown.shipping > 0) {
    lines.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(breakdown.shipping * 100),
        product_data: { name: "Shipping" },
      },
    });
  }

  if (breakdown.tax > 0) {
    lines.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(breakdown.tax * 100),
        product_data: { name: "Estimated tax" },
      },
    });
  }

  return lines;
}
