import mongoose, { type Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { checkoutErrors } from "@/lib/site-copy";

type CartRow = { productId: Types.ObjectId; quantity: number };

export const cartLineInput = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export function mergeCartLines(
  lines: z.infer<typeof cartLineInput>[],
): { productId: string; quantity: number }[] {
  const map = new Map<string, number>();
  for (const row of lines) {
    const q = Math.min(99, (map.get(row.productId) ?? 0) + row.quantity);
    map.set(row.productId, q);
  }
  return Array.from(map.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export type OrderItemBuild = {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
};

export async function buildValidatedOrderItems(
  lines: { productId: string; quantity: number }[],
): Promise<
  | {
      ok: true;
      orderItems: OrderItemBuild[];
      subtotal: number;
    }
  | { ok: false; error: string }
> {
  if (!lines.length) return { ok: false, error: checkoutErrors.cartEmpty };
  await connectDB();
  const ids = lines.map((l) => l.productId);
  const products = await Product.find({
    _id: { $in: ids },
    isActive: true,
  });
  const byId = new Map(products.map((p) => [p._id.toString(), p] as const));
  let subtotal = 0;
  const orderItems: OrderItemBuild[] = [];

  for (const row of lines) {
    const p = byId.get(row.productId);
    if (!p) return { ok: false, error: checkoutErrors.productUnavailable };
    if (p.stock < row.quantity) {
      return {
        ok: false,
        error: `${checkoutErrors.stockPrefix} ${p.name}`,
      };
    }
    subtotal += p.price * row.quantity;
    orderItems.push({
      productId: p._id,
      name: p.name,
      price: p.price,
      quantity: row.quantity,
    });
  }
  return { ok: true, orderItems, subtotal };
}

export async function linesFromMemberCart(
  userId: string,
): Promise<{ productId: string; quantity: number }[]> {
  await connectDB();
  const cart = await Cart.findOne({ userId });
  if (!cart?.items.length) return [];
  const rows = cart.items as unknown as CartRow[];
  return rows.map((r) => ({
    productId: r.productId.toString(),
    quantity: r.quantity,
  }));
}
