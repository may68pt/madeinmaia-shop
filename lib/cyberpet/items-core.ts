/* CyberPet rare items: tiers, categories and validation. Pure, so tests and the admin UI can import it. */

export const TIERS = ["common", "uncommon", "rare", "epic", "legendary", "exclusive"] as const;
export const CATEGORIES = ["furniture", "decor", "toy", "food", "costume", "theme"] as const;
export const TIER_COLOR: Record<string, string> = { common: "#c9c9d6", uncommon: "#8dff4a", rare: "#3fd0ff", epic: "#b06bff", legendary: "#ffd23f", exclusive: "#ff3fd8" };
/** Default drop weights (percent) per tier, used by gift drops; exclusive never drops. */
export const TIER_WEIGHT: Record<string, number> = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1, exclusive: 0 };

export type Tier = (typeof TIERS)[number];
export type ItemRow = {
  id: string; name: string; description: string; tier: Tier; category: string; art_url: string;
  room: { h: number; kind?: "wall" | "floor"; comfort: number; react?: string };
  stats: Record<string, number>; price_coins: number; price_gems: number; price_cents: number | null;
  supply_limit: number | null; sold: number; in_shop: boolean; active: boolean;
};

const STAT_KEYS = ["happy", "energy", "health", "rest", "bond"];
const int = (v: unknown, lo: number, hi: number, d = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };

export function cleanItem(raw: unknown): { ok: true; item: Omit<ItemRow, "sold"> } | { ok: false; error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  let id = String(r.id ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40);
  if (id && !id.startsWith("rx_")) id = ("rx_" + id).slice(0, 40);
  if (!/^rx_[a-z0-9_]{2,37}$/.test(id)) return { ok: false, error: "Id: 2+ letters, numbers or _" };
  const name = String(r.name ?? "").replace(/[<>]/g, "").trim().slice(0, 40);
  if (!name) return { ok: false, error: "Item needs a name" };
  const tier = (TIERS as readonly string[]).includes(String(r.tier)) ? (r.tier as Tier) : "common";
  const category = (CATEGORIES as readonly string[]).includes(String(r.category)) ? String(r.category) : "decor";
  const art = String(r.art_url ?? "").trim();
  if (art && !/^(\/|https:\/\/)[^\s"'<>]+$/.test(art)) return { ok: false, error: "Art must be an /uploads/… path or an https URL" };
  const roomIn = (r.room && typeof r.room === "object" ? r.room : {}) as Record<string, unknown>;
  const room = { h: Math.max(0.04, Math.min(0.7, Number(roomIn.h) || 0.14)), kind: roomIn.kind === "wall" ? ("wall" as const) : ("floor" as const), comfort: int(roomIn.comfort, 0, 20, 2), ...(typeof roomIn.react === "string" && /^(wiggle|bounce|flicker|pulse|secret)$/.test(roomIn.react) ? { react: roomIn.react } : {}) };
  const statsIn = (r.stats && typeof r.stats === "object" ? r.stats : {}) as Record<string, unknown>;
  const stats: Record<string, number> = {};
  for (const k of STAT_KEYS) if (statsIn[k] !== undefined && statsIn[k] !== "" && Number(statsIn[k])) stats[k] = int(statsIn[k], -50, 50);
  const cents = r.price_cents === null || r.price_cents === undefined || r.price_cents === "" ? null : int(r.price_cents, 50, 100000, 0) || null;
  const supply = r.supply_limit === null || r.supply_limit === undefined || r.supply_limit === "" ? null : int(r.supply_limit, 1, 1_000_000, 0) || null;
  return {
    ok: true,
    item: {
      id, name, description: String(r.description ?? "").replace(/[<>]/g, "").slice(0, 200), tier, category, art_url: art, room, stats,
      price_coins: int(r.price_coins, 0, 1_000_000), price_gems: int(r.price_gems, 0, 10_000), price_cents: cents,
      supply_limit: supply, in_shop: r.in_shop !== false, active: r.active !== false,
    },
  };
}

/** What the app stores in the save for an owned item, so it renders offline too. */
export function clientDef(it: Pick<ItemRow, "id" | "name" | "tier" | "category" | "art_url" | "room" | "stats">) {
  return { id: it.id, n: it.name, tier: it.tier, cat: it.category, img: it.art_url, h: it.room.h, kind: it.room.kind, comfort: it.room.comfort, react: it.room.react, stats: it.stats };
}

export const remaining = (it: Pick<ItemRow, "supply_limit" | "sold">) => (it.supply_limit === null ? null : Math.max(0, it.supply_limit - it.sold));
