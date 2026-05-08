"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import mongoose, { type Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";
import { primaryImage } from "@/products/images";
import { authOptions } from "@/auth/options";

type CartItemRow = { productId: Types.ObjectId; quantity: number };

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string;
  stock: number;
};

async function getOrCreateCartDoc(userId: string) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

export async function getCartLines(): Promise<CartLine[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  await connectDB();
  const cart = await getOrCreateCartDoc(session.user.id);
  if (!cart.items.length) return [];
  const rows = cart.items as unknown as CartItemRow[];
  const ids = rows.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(
    products.map((p) => [p._id.toString(), p] as const),
  );
  return rows
    .map((item) => {
      const p = byId.get(item.productId.toString());
      if (!p) return null;
      return {
        productId: p._id.toString(),
        name: p.name,
        slug: p.slug,
        price: p.price,
        quantity: item.quantity,
        imageUrl: primaryImage(p),
        stock: p.stock,
      };
    })
    .filter((x): x is CartLine => x !== null);
}

export type CartActionState = { error?: string; ok?: boolean };

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

export async function addToCart(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sign in to add items to your cart" };
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { error: "Invalid cart input" };
  const { productId, quantity } = parsed.data;
  await connectDB();
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return { error: "Product not found" };
  if (product.stock < quantity) return { error: "Not enough stock" };
  const cart = await getOrCreateCartDoc(session.user.id);
  const pid = new mongoose.Types.ObjectId(productId);
  const rows = cart.items as unknown as CartItemRow[];
  const existing = rows.find((i) => i.productId.toString() === productId);
  if (existing) {
    const nextQty = existing.quantity + quantity;
    if (nextQty > product.stock) return { error: "Not enough stock" };
    existing.quantity = nextQty;
  } else {
    cart.items.push({ productId: pid, quantity });
  }
  await cart.save();
  revalidatePath("/cart");
  revalidatePath("/products");
  return { ok: true };
}

export async function removeCartLine(productId: string): Promise<CartActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sign in required" };
  await connectDB();
  const cart = await Cart.findOne({ userId: session.user.id });
  if (!cart) return { ok: true };
  cart.items = (cart.items as unknown as CartItemRow[]).filter(
    (i) => i.productId.toString() !== productId,
  ) as typeof cart.items;
  await cart.save();
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartLineFromForm(formData: FormData): Promise<void> {
  const id = formData.get("productId");
  if (typeof id !== "string" || !id) return;
  await removeCartLine(id);
}

const qtyUpdateSchema = z.coerce.number().int().min(0).max(99);

export async function updateCartItemQuantity(
  productId: string,
  quantity: unknown,
): Promise<CartActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sign in required" };
  const parsed = qtyUpdateSchema.safeParse(quantity);
  if (!parsed.success) return { error: "Invalid quantity" };
  const raw = parsed.data;
  if (raw < 1) return removeCartLine(productId);
  await connectDB();
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return { error: "Product not available" };
  const nextQty = Math.min(raw, product.stock, 99);
  const cart = await getOrCreateCartDoc(session.user.id);
  const rows = cart.items as unknown as CartItemRow[];
  const row = rows.find((i) => i.productId.toString() === productId);
  if (!row) return { error: "Item not in cart" };
  row.quantity = nextQty;
  await cart.save();
  revalidatePath("/cart");
  return { ok: true };
}

const mergeLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
});

const mergeGuestSchema = z.array(mergeLineSchema).max(100);

/** Merge guest lines into the signed-in user's cart (adds quantities, capped by stock). */
export async function mergeGuestCartToServer(
  lines: unknown,
): Promise<CartActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sign in required" };
  if (!Array.isArray(lines) || lines.length === 0) return { ok: true };
  const parsed = mergeGuestSchema.safeParse(lines);
  if (!parsed.success) return { error: "Invalid cart data" };
  await connectDB();
  const cart = await getOrCreateCartDoc(session.user.id);
  const rows = cart.items as unknown as CartItemRow[];

  for (const gl of parsed.data) {
    const product = await Product.findById(gl.productId);
    if (!product || !product.isActive) continue;
    const qty = Math.min(gl.quantity, product.stock, 99);
    if (qty < 1) continue;
    const pid = new mongoose.Types.ObjectId(gl.productId);
    const existing = rows.find((i) => i.productId.toString() === gl.productId);
    if (existing) {
      const merged = Math.min(existing.quantity + qty, product.stock, 99);
      existing.quantity = merged;
    } else {
      cart.items.push({ productId: pid, quantity: qty });
    }
  }
  await cart.save();
  revalidatePath("/cart");
  return { ok: true };
}
