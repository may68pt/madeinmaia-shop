import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import Stripe from "stripe";
import { createHash, timingSafeEqual } from "node:crypto";
import { getDb } from "@/db";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { grantItem } from "@/lib/cyberpet/items";
import { remaining, type ItemRow } from "@/lib/cyberpet/items-core";
import { claimQr, shopReleaseItems } from "@/lib/cyberpet/releases";

/* CyberPet rare shop: list what is on sale for this pet, buy with ⚡/💎, or start a Stripe checkout. */
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const json = (o: unknown, status = 200) => NextResponse.json(o, { status, headers });
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[^A-Za-z0-9_]/g, "").slice(0, n);
const hash = (k: string) => createHash("sha256").update(k).digest("hex");

async function owner(id: string, key: string) {
  if (!id || key.length < 20) return null;
  const [r] = (await getDb().execute(sql`select id, key_hash, created_at, data from petz_saves where id=${id}`)) as unknown as { id: string; key_hash: string; created_at: string; data: Record<string, unknown> }[];
  if (!r) return null;
  const b = Buffer.from(hash(key));
  return r.key_hash.split(",").some((h) => { const a = Buffer.from(h); return a.length === b.length && timingSafeEqual(a, b); }) ? r : null;
}

const pub = (it: ItemRow, paid: boolean) => ({
  id: it.id, name: it.name, description: it.description, tier: it.tier, category: it.category, art: it.art_url,
  coins: it.price_coins, gems: it.price_gems, cents: paid ? it.price_cents : null, left: remaining(it), room: it.room,
});

async function shopFlags() {
  const rows = (await getDb().execute(sql`select key, value from petz_config where key in ('shop_enabled','shop_paid_enabled')`)) as unknown as { key: string; value: unknown }[];
  const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { open: v.shop_enabled !== false, paid: v.shop_paid_enabled === true && !!process.env.STRIPE_SECRET_KEY };
}

export async function GET(request: Request) {
  const u = new URL(request.url);
  try {
    const flags = await shopFlags();
    if (!flags.open) return json({ ok: true, open: false, items: [], owned: [] });
    const pet = await owner(clean(u.searchParams.get("id"), 16), clean(u.searchParams.get("key"), 64));
    const always = (await getDb().execute(sql`select * from petz_items where active and in_shop and tier <> 'exclusive' order by price_gems, price_coins`)) as unknown as ItemRow[];
    const extra = pet ? await shopReleaseItems({ id: pet.id, createdAt: pet.created_at, data: pet.data }) : [];
    const seen = new Set<string>(), items = [...always, ...extra].filter((i) => !seen.has(i.id) && seen.add(i.id));
    const owned = pet ? ((await getDb().execute(sql`select item_id from petz_item_grants where pet_id=${pet.id}`)) as unknown as { item_id: string }[]).map((r) => r.item_id) : [];
    return json({ ok: true, open: true, paid: flags.paid, items: items.map((i) => pub(i, flags.paid)), owned });
  } catch { return json({ ok: false, error: "Shop unavailable" }, 503); }
}

export async function POST(request: Request) {
  if (await rateLimited(clientIp(request), "petz-shop", 20)) return json({ ok: false, error: "Slow down" }, 429);
  let b: Record<string, unknown>;
  try { b = (await request.json()) as Record<string, unknown>; } catch { return json({ ok: false, error: "Invalid" }, 400); }
  try {
    const pet = await owner(clean(b.id, 16), clean(b.key, 64));
    if (!pet) return json({ ok: false, error: "Cloud pet not found. Turn on cloud sync first." }, 404);
    if (b.action === "qr") {
      const code = clean(b.code, 16).toUpperCase();
      const r = await claimQr({ id: pet.id, createdAt: pet.created_at, data: pet.data }, code);
      return r.ok ? json(r) : json(r, r.status);
    }
    const itemId = clean(b.item, 40).toLowerCase();
    const flags = await shopFlags();
    if (!flags.open) return json({ ok: false, error: "The shop is closed" }, 403);
    // only items that are actually on sale for this pet can be bought
    const always = (await getDb().execute(sql`select id from petz_items where id=${itemId} and active and in_shop and tier <> 'exclusive'`)) as unknown as { id: string }[];
    const viaRelease = always[0] ? [] : (await shopReleaseItems({ id: pet.id, createdAt: pet.created_at, data: pet.data })).filter((i) => i.id === itemId);
    if (!always[0] && !viaRelease.length) return json({ ok: false, error: "Not on sale" }, 404);
    if (b.action === "buy") {
      const r = await grantItem(pet.id, itemId, "shop", "", true);
      return r.ok ? json({ ok: true, patch: r.patch }) : json(r, r.status);
    }
    if (b.action === "checkout") {
      if (!flags.paid) return json({ ok: false, error: "Paid items are not available" }, 403);
      const [it] = (await getDb().execute(sql`select * from petz_items where id=${itemId}`)) as unknown as ItemRow[];
      if (!it?.price_cents) return json({ ok: false, error: "This item has no price in euros" }, 400);
      const left = remaining(it); if (left !== null && left <= 0) return json({ ok: false, error: "Sold out" }, 409);
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
      const origin = new URL(request.url).origin;
      const meta = { kind: "cyberpet_item", pet: pet.id, item: it.id };
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: it.price_cents, product_data: { name: `CyberPet: ${it.name}`, description: `${it.tier} ${it.category} for your CyberPet` } } }],
        success_url: `${origin}/petz?paid=${it.id}`, cancel_url: `${origin}/petz`,
        metadata: meta, payment_intent_data: { metadata: meta },
      });
      return json({ ok: true, url: session.url });
    }
    return json({ ok: false, error: "Unknown action" }, 400);
  } catch { return json({ ok: false, error: "Shop unavailable" }, 503); }
}
