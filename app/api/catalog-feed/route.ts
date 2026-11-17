// MiM Catálogo Studio feed: per-design daily sales, views and cart adds.
// GET /api/catalog-feed?days=90  (headers x-studio-user / x-studio-key, same as /api/analytics)
// Returns JSON the Catálogo Studio imports in LIGAÇÕES › mim-dash.
import { NextResponse } from "next/server";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { analyticsEvents, orders, products } from "@/db/schema";
import { sessionFromRequest } from "@/lib/catalogo-auth";

export const dynamic = "force-dynamic";

function authenticated(request: Request) {
  if (sessionFromRequest(request)) return true;
  const url = new URL(request.url);
  const user = request.headers.get("x-studio-user") || url.searchParams.get("user");
  const key = request.headers.get("x-studio-key") || url.searchParams.get("key");
  return Boolean(process.env.STUDIO_PASSWORD && user === (process.env.STUDIO_USERNAME || "madeinmaia") && key === process.env.STUDIO_PASSWORD);
}

type Day = { units: number; revenue: number; orders: number; views: number; cart: number };

export async function GET(request: Request) {
  if (!authenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(7, Number(url.searchParams.get("days")) || 90));
  const start = new Date(Date.now() - days * 86400000);
  const db = getDb();
  try {
    const [catalogue, paid, views] = await Promise.all([
      db.select({ slug: products.slug, code: products.designCode, name: products.name, priceCents: products.priceCents }).from(products),
      db.select({ items: orders.items, createdAt: orders.createdAt, reference: orders.reference }).from(orders)
        .where(and(gte(orders.createdAt, start), inArray(orders.status, ["paid", "preparing", "shipped", "completed"]))),
      db.select({
        slug: analyticsEvents.entityId,
        day: sql<string>`to_char(date_trunc('day', ${analyticsEvents.createdAt}), 'YYYY-MM-DD')`,
        views: sql<number>`count(*) filter (where ${analyticsEvents.eventName} = 'product_view')`,
        cart: sql<number>`count(*) filter (where ${analyticsEvents.eventName} = 'add_to_cart')`,
      }).from(analyticsEvents)
        .where(and(gte(analyticsEvents.createdAt, start), eq(analyticsEvents.entityType, "product"), sql`${analyticsEvents.metadata}->>'consentVersion' = '1'`))
        .groupBy(analyticsEvents.entityId, sql`date_trunc('day', ${analyticsEvents.createdAt})`),
    ]);
    const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
    const designs = new Map<string, { code: string; slug: string; name: string; priceCents: number; daily: Record<string, Day> }>();
    const entry = (slug: string) => {
      const p = bySlug.get(slug);
      const code = (p?.code || slug.match(/^(\d{3,4})/)?.[1] || slug).trim();
      if (!designs.has(code)) designs.set(code, { code, slug, name: p?.name || slug, priceCents: p?.priceCents || 0, daily: {} });
      return designs.get(code)!;
    };
    const dayOf = (e: ReturnType<typeof entry>, d: string) => (e.daily[d] ||= { units: 0, revenue: 0, orders: 0, views: 0, cart: 0 });
    for (const o of paid) {
      const d = o.createdAt.toISOString().slice(0, 10);
      const seen = new Set<string>();
      for (const it of o.items || []) {
        const e = entry(it.slug);
        const day = dayOf(e, d);
        day.units += it.quantity || 1;
        day.revenue += (it.unitPriceCents || 0) * (it.quantity || 1);
        if (!seen.has(e.code)) { day.orders += 1; seen.add(e.code); }
      }
    }
    for (const v of views) {
      if (!v.slug) continue;
      const day = dayOf(entry(v.slug), v.day);
      day.views += Number(v.views) || 0;
      day.cart += Number(v.cart) || 0;
    }
    return NextResponse.json({
      source: "mim-dash", version: 1, generated: new Date().toISOString(), days,
      totals: { orders: paid.length, revenueCents: paid.reduce((s, o) => s + (o.items || []).reduce((a, it) => a + (it.unitPriceCents || 0) * (it.quantity || 1), 0), 0) },
      designs: [...designs.values()],
    }, { headers: { "Content-Disposition": `attachment; filename="mim-catalog-feed-${new Date().toISOString().slice(0, 10)}.json"` } });
  } catch (error) {
    return NextResponse.json({ error: "Feed indisponível", detail: String(error).slice(0, 200) }, { status: 503 });
  }
}
