import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Guest cart line (mirrors server `CartLine` shape for shared UI). */
export type GuestCartLine = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl: string;
  /** Stock snapshot when the line was added/updated (caps qty until merge). */
  maxStock?: number;
};

type GuestCartState = {
  lines: GuestCartLine[];
  addLine: (
    line: Omit<GuestCartLine, "quantity"> & { quantity?: number },
    maxStock: number,
  ) => void;
  removeLine: (productId: string) => void;
  setQuantity: (productId: string, quantity: number, maxStock: number) => void;
  clear: () => void;
};

export const useGuestCartStore = create(
  persist<GuestCartState>(
    (set, get) => ({
      lines: [],
      addLine: (input, maxStock) => {
        const addQty = Math.min(
          Math.max(1, input.quantity ?? 1),
          maxStock,
          99,
        );
        const lines = [...get().lines];
        const i = lines.findIndex((l) => l.productId === input.productId);
        if (i >= 0) {
          const cap = Math.min(maxStock, lines[i].maxStock ?? maxStock, 99);
          const nextQty = Math.min(lines[i].quantity + addQty, cap);
          lines[i] = { ...lines[i], quantity: nextQty, maxStock: cap };
        } else {
          lines.push({
            productId: input.productId,
            name: input.name,
            slug: input.slug,
            price: input.price,
            imageUrl: input.imageUrl,
            quantity: addQty,
            maxStock: Math.min(maxStock, 99),
          });
        }
        set({ lines });
      },
      removeLine: (productId) =>
        set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      setQuantity: (productId, quantity, maxStock) => {
        if (quantity < 1) {
          set({ lines: get().lines.filter((l) => l.productId !== productId) });
          return;
        }
        const cap = Math.min(maxStock, 99);
        const q = Math.min(Math.max(1, Math.floor(quantity)), cap);
        const lines = get().lines.map((l) =>
          l.productId === productId
            ? {
                ...l,
                quantity: q,
                maxStock: Math.min(l.maxStock ?? cap, cap),
              }
            : l,
        );
        set({ lines });
      },
      clear: () => set({ lines: [] }),
    }),
    { name: "ecom-guest-cart" },
  ),
);
