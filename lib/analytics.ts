export const ANALYTICS_EVENTS = ["page_view", "product_view", "add_to_cart", "checkout_started"] as const;
export type AnalyticsEvent = typeof ANALYTICS_EVENTS[number];

/** Never store URLs with query strings, user IDs, email, IP, user agents or session identifiers. */
export function normalizeAnalyticsPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 250) return null;
  const path = value.split(/[?#]/, 1)[0].replace(/\/{2,}/g, "/");
  if (!/^\/[a-zA-Z0-9/_-]*$/.test(path)) return null;
  if (path.startsWith("/api/") || path.startsWith("/studio") || path.startsWith("/conta") || path.startsWith("/checkout")) return null;
  return path === "/" ? path : path.replace(/\/$/, "");
}
