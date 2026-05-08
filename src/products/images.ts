/** Normalize product images from DB (supports legacy `imageUrl`). */
export function getProductImages(p: {
  images?: string[] | null;
  imageUrl?: string | null;
}): string[] {
  const fromArray = (p.images ?? []).map((s) => s.trim()).filter(Boolean);
  if (fromArray.length) return fromArray;
  const legacy = (p.imageUrl ?? "").trim();
  return legacy ? [legacy] : [];
}

export function primaryImage(p: {
  images?: string[] | null;
  imageUrl?: string | null;
}): string {
  const imgs = getProductImages(p);
  return imgs[0] ?? "";
}
