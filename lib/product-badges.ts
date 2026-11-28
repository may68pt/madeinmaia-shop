/**
 * Badges on product cards.
 *
 * - newMode "auto" (default): "New" for NEW_BADGE_DAYS after the design was published.
 *   "on" always shows it, "off" never does.
 * - bestSeller: "Best seller".
 * - category: shows the design's collection (e.g. "Cats").
 * - promo: free text, e.g. "-20%" or "Black Friday".
 */
export type ProductBadges = {
  newMode?: "auto" | "on" | "off";
  bestSeller?: boolean;
  category?: boolean;
  promo?: string;
};

export const NEW_BADGE_DAYS = 60;

export type CardBadge = { key: "new" | "best" | "category" | "promo"; label: string };

export function normalizeBadges(value: unknown): ProductBadges {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const newMode = input.newMode === "on" || input.newMode === "off" ? input.newMode : "auto";
  const promo = typeof input.promo === "string" ? input.promo.trim().slice(0, 24) : "";
  return { newMode, bestSeller: input.bestSeller === true, category: input.category === true, ...(promo ? { promo } : {}) };
}

/** Date the automatic "New" badge ends, or null when the design has no publish date. */
export function newBadgeEndsAt(publishedAt: string | Date | null | undefined): Date | null {
  if (!publishedAt) return null;
  const start = new Date(publishedAt);
  return Number.isNaN(start.getTime()) ? null : new Date(start.getTime() + NEW_BADGE_DAYS * 86_400_000);
}

export function cardBadges(
  product: { badges?: ProductBadges | null; publishedAt?: string | Date | null; collection?: string },
  labels: { new: string; bestSeller: string },
  now: Date = new Date(),
): CardBadge[] {
  const badges = normalizeBadges(product.badges);
  const list: CardBadge[] = [];
  if (badges.promo) list.push({ key: "promo", label: badges.promo });
  const endsAt = newBadgeEndsAt(product.publishedAt);
  if (badges.newMode === "on" || (badges.newMode === "auto" && endsAt && endsAt > now)) list.push({ key: "new", label: labels.new });
  if (badges.bestSeller) list.push({ key: "best", label: labels.bestSeller });
  if (badges.category && product.collection && product.collection !== "Made in Maia") list.push({ key: "category", label: product.collection });
  return list;
}
