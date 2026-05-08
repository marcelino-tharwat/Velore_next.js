/** Store tax, shipping, and free-shipping threshold rules. */

export const TAX_RATE = 0.07;

export const SHIPPING_FLAT = 5.99;

/** Subtotal after discount must meet this to waive flat shipping */
export const FREE_SHIPPING_MIN = 75;

export type PriceBreakdown = {
  subtotal: number;
  discount: number;
  taxableSubtotal: number;
  tax: number;
  shipping: number;
  total: number;
};

export function computeBreakdown(
  subtotal: number,
  discountRaw: number,
): PriceBreakdown {
  const d = Math.min(Math.max(0, discountRaw), Math.max(0, subtotal));
  const taxableSubtotal = Math.round((Math.max(0, subtotal) - d) * 100) / 100;
  const tax = Math.round(taxableSubtotal * TAX_RATE * 100) / 100;
  const shipping =
    taxableSubtotal <= 0 ? 0 : taxableSubtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
  const total =
    Math.round((taxableSubtotal + tax + shipping) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: d,
    taxableSubtotal,
    tax,
    shipping,
    total,
  };
}
