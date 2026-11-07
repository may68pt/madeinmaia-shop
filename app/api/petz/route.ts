import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@/db";
import { clientIp, rateLimited } from "@/lib/rate-limit";
import { social } from "./social";
import { ackOps, pendingOps } from "@/lib/cyberpet/ops";
import { deliverGifts } from "@/lib/cyberpet/releases";

/* CyberPet cloud save — no accounts. Each pet has an id + secret key kept on the device.
   Other devices join with a short-lived 6-letter link code. */
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
const MAX = 400_000;
const ABC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const ipOf = clientIp;
const limited = (ip: string, bucket: string, perMin: number) => rateLimited(ip, "petz-" + bucket, perMin);
const hash = (k: string) => createHash("sha256").update(k).digest("hex");
const rnd = (n: number) => Array.from(randomBytes(n), (b) => ABC[b % ABC.length]).join("");
const safeParse = (raw: string): unknown => { try { return JSON.parse(raw || "null"); } catch { return null; } };
const json = (o: unknown, status = 200) => NextResponse.json(o, { status, headers });
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, n);

type Row = { id: string; key_hash: string; rev: number; t: string | number; data: unknown; created_at: string };
async function load(id: string, key: string): Promise<Row | null> {
  if (!id || key.length < 20) return null;
  const rows = (await getDb().execute(sql`select id, key_hash, rev, t, data, created_at from petz_saves where id=${id}`)) as unknown as Row[];
  const r = rows[0];
  if (!r) return null;
  const b = Buffer.from(hash(key));
  // one hash per linked device
  return r.key_hash.split(",").some((h) => { const a = Buffer.from(h); return a.length === b.length && timingSafeEqual(a, b); }) ? r : null;
}
const out = (r: Row) => ({ ok: true, id: r.id, rev: Number(r.rev), t: Number(r.t), data: r.data });

export async function GET(request: Request) {
  const u = new URL(request.url);
  if (await limited(ipOf(request), "g", 120)) return json({ ok: false, error: "slow down" }, 429);
  try {
    const r = await load(clean(u.searchParams.get("id"), 16), clean(u.searchParams.get("key"), 64));
    if (!r) return json({ ok: false, error: "not found" }, 404);
    // live ops from the back office ride along with every pull; a failure here never blocks the save
    const facts = { id: r.id, createdAt: r.created_at, data: r.data as Record<string, unknown> };
    const ops = await pendingOps(facts).catch(() => []);
    // gift releases are granted server-side; the app applies the same patch so the item shows up at once
    const gifts = await deliverGifts(facts).catch(() => []);
    return json({ ...out(r), ops, gifts });
  } catch { return json({ ok: false }, 503); }
}

export async function PUT(request: Request) {
  if (await limited(ipOf(request), "p", 60)) return json({ ok: false, error: "slow down" }, 429);
  const raw = await request.text();
  if (raw.length > MAX) return json({ ok: false, error: "too big" }, 413);
  const b = safeParse(raw) as { id?: string; key?: string; base?: number; t?: number; data?: unknown } | null;
  if (!b || typeof b.data !== "object" || b.data === null) return json({ ok: false, error: "invalid" }, 400);
  try {
    const r = await load(clean(b.id, 16), clean(b.key, 64));
    if (!r) return json({ ok: false, error: "not found" }, 404);
    const t = Math.floor(Number(b.t) || Date.now());
    const upd = (await getDb().execute(sql`update petz_saves set data=${JSON.stringify(b.data)}::jsonb, t=${t}, rev=rev+1, updated_at=now()
      where id=${r.id} and rev=${Math.floor(Number(b.base))} returning rev`)) as unknown as { rev: number }[];
    if (!upd[0]) {
      const cur = await load(r.id, clean(b.key, 64));
      return json(cur ? { ...out(cur), ok: false, conflict: true } : { ok: false }, 409);
    }
    return json({ ok: true, rev: Number(upd[0].rev) });
  } catch { return json({ ok: false }, 503); }
}

export async function POST(request: Request) {
  const ip = ipOf(request);
  const raw = await request.text();
  if (raw.length > MAX) return json({ ok: false, error: "too big" }, 413);
  const b = safeParse(raw) as { action?: string; id?: string; key?: string; code?: string; data?: unknown; t?: number; ops?: unknown } | null;
  if (!b) return json({ ok: false, error: "invalid" }, 400);
  try {
    const db = getDb();
    if (typeof b.action === "string" && b.action.startsWith("social-")) {
      const state = b.action === "social-state";
      if (await limited(ip, state ? "social-state" : "social-action", state ? 100 : 30)) return json({ ok: false, error: "Try again in a moment" }, 429);
      const pet = await load(clean(b.id, 16), clean(b.key, 64));
      if (!pet) return json({ ok: false, error: "Cloud pet not found" }, 404);
      return await social(pet.id, b);
    }
    if (b.action === "ops-ack") {
      if (await limited(ip, "ack", 60)) return json({ ok: false, error: "slow down" }, 429);
      const pet = await load(clean(b.id, 16), clean(b.key, 64));
      if (!pet) return json({ ok: false, error: "not found" }, 404);
      return json({ ok: true, acked: await ackOps(pet.id, b.ops) });
    }
    if (b.action === "create") {
      if (await limited(ip, "c", 5)) return json({ ok: false, error: "slow down" }, 429);
      if (typeof b.data !== "object" || b.data === null) return json({ ok: false, error: "invalid" }, 400);
      const id = rnd(10), key = randomBytes(24).toString("hex");
      await db.execute(sql`insert into petz_saves (id, key_hash, rev, t, data) values (${id}, ${hash(key)}, 1, ${Math.floor(Number(b.t) || Date.now())}, ${JSON.stringify(b.data)}::jsonb)`);
      return json({ ok: true, id, key, rev: 1 });
    }
    if (b.action === "pair") {
      if (await limited(ip, "pa", 10)) return json({ ok: false, error: "slow down" }, 429);
      const r = await load(clean(b.id, 16), clean(b.key, 64));
      if (!r) return json({ ok: false, error: "not found" }, 404);
      const code = rnd(6);
      await db.execute(sql`delete from petz_links where expires_at < now()`);
      await db.execute(sql`insert into petz_links (code, pet_id, expires_at) values (${code}, ${r.id}, now() + interval '30 minutes')`);
      return json({ ok: true, code, minutes: 30 });
    }
    if (b.action === "claim") {
      if (await limited(ip, "cl", 8)) return json({ ok: false, error: "slow down" }, 429);
      const code = clean(b.code, 8).toUpperCase();
      const rows = (await db.execute(sql`select pet_id from petz_links where code=${code} and expires_at > now()`)) as unknown as { pet_id: string }[];
      if (!rows[0]) return json({ ok: false, error: "expired" }, 404);
      // hand the joining device its own key for this pet: rotate is avoided so existing devices keep working
      const key = randomBytes(24).toString("hex");
      await db.execute(sql`update petz_saves set key_hash = array_to_string((string_to_array(key_hash, ','))[greatest(1, cardinality(string_to_array(key_hash, ',')) - 18):] || ${hash(key)}::text, ',') where id=${rows[0].pet_id}`);
      const r = (await db.execute(sql`select id, key_hash, rev, t, data, created_at from petz_saves where id=${rows[0].pet_id}`)) as unknown as Row[];
      return json({ ...out(r[0]), key });
    }
    return json({ ok: false, error: "unknown action" }, 400);
  } catch { return json({ ok: false }, 503); }
}
