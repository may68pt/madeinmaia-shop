/* CyberPet back office: pure rules shared by the admin API, the pet API and tests.
   No database or framework imports here, so `node --test` can load this file directly. */

export const STATS = ["happy", "energy", "health", "rest", "bond"] as const;
export const STAGES = ["egg", "baby", "juv", "teen", "adult"] as const;
export const OP_KINDS = ["grant", "stat", "message", "anim", "flag", "revive"] as const;
export const SCOPES = ["all", "class", "pets"] as const;

export type Stat = (typeof STATS)[number];
export type Stage = (typeof STAGES)[number];
export type OpKind = (typeof OP_KINDS)[number];
export type Scope = (typeof SCOPES)[number];

/** A class is a saved filter over pets. Every field is optional; an empty rule matches every pet. */
export type ClassRule = {
  variants?: string[];
  stages?: Stage[];
  minLevel?: number;
  maxLevel?: number;
  createdAfter?: string;
  createdBefore?: string;
  petIds?: string[];
};

export type PetFacts = { id: string; createdAt: string | Date; data: Record<string, unknown> | null };

const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);

/** Same thresholds as the app's stageKey(). */
export function stageOf(data: Record<string, unknown> | null): Stage {
  if (!data || data.stage === "egg") return "egg";
  const g = num(data.growth);
  return g < 72 ? "baby" : g < 360 ? "juv" : g < 744 ? "teen" : "adult";
}

/** Same curve as the app's lvInfo(): level n needs 100 + (n-1)*60 xp. */
export function levelOf(data: Record<string, unknown> | null): number {
  let l = 1, x = num(data?.xp);
  while (x >= 100 + (l - 1) * 60 && l < 99) { x -= 100 + (l - 1) * 60; l++; }
  return l;
}

export function matchesRule(rule: ClassRule | null | undefined, pet: PetFacts): boolean {
  if (!rule) return true;
  const d = pet.data ?? {};
  if (rule.petIds?.length && !rule.petIds.includes(pet.id)) return false;
  if (rule.variants?.length && !rule.variants.includes(String(d.variant ?? ""))) return false;
  if (rule.stages?.length && !rule.stages.includes(stageOf(d))) return false;
  const lv = levelOf(d);
  if (typeof rule.minLevel === "number" && lv < rule.minLevel) return false;
  if (typeof rule.maxLevel === "number" && lv > rule.maxLevel) return false;
  const born = new Date(pet.createdAt).getTime();
  if (rule.createdAfter && born < Date.parse(rule.createdAfter)) return false;
  if (rule.createdBefore && born > Date.parse(rule.createdBefore)) return false;
  return true;
}

const ID = /^[A-Za-z0-9]{1,16}$/;
const KEY = /^[a-z0-9_-]{1,40}$/i;
const cleanText = (v: unknown, n: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);
const clampN = (v: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(num(typeof v === "string" ? Number(v) : v))));

/** Normalises a class rule from the admin UI; unknown fields are dropped. */
export function cleanRule(raw: unknown): ClassRule {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const list = (v: unknown, re: RegExp, max = 500) =>
    Array.isArray(v) ? [...new Set(v.map(String).filter((s) => re.test(s)))].slice(0, max) : undefined;
  const out: ClassRule = {};
  const variants = list(r.variants, KEY, 40); if (variants?.length) out.variants = variants;
  const stages = list(r.stages, /^(egg|baby|juv|teen|adult)$/) as Stage[] | undefined; if (stages?.length) out.stages = stages;
  const petIds = list(r.petIds, ID, 5000); if (petIds?.length) out.petIds = petIds;
  if (r.minLevel !== undefined && r.minLevel !== "") out.minLevel = clampN(r.minLevel, 1, 99);
  if (r.maxLevel !== undefined && r.maxLevel !== "") out.maxLevel = clampN(r.maxLevel, 1, 99);
  for (const k of ["createdAfter", "createdBefore"] as const)
    if (typeof r[k] === "string" && !Number.isNaN(Date.parse(r[k] as string))) out[k] = new Date(r[k] as string).toISOString();
  return out;
}

export type OpPayload =
  | { kind: "grant"; coins?: number; gems?: number; xp?: number; items?: Record<string, number> }
  | { kind: "stat"; set?: Partial<Record<Stat, number>>; add?: Partial<Record<Stat, number>> }
  | { kind: "message"; text: string; title?: string; style: "toast" | "say" | "modal" }
  | { kind: "anim"; name: string }
  | { kind: "flag"; key: string; value: string | number | boolean | null }
  | { kind: "revive" };

/** Validates an op from the admin UI. Returns the clean payload or an error message. */
export function cleanOp(raw: unknown): { ok: true; op: OpPayload } | { ok: false; error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  switch (r.kind) {
    case "grant": {
      const op: OpPayload = { kind: "grant" };
      if (r.coins) op.coins = clampN(r.coins, -100000, 100000);
      if (r.gems) op.gems = clampN(r.gems, -1000, 1000);
      if (r.xp) op.xp = clampN(r.xp, -100000, 100000);
      if (r.items && typeof r.items === "object") {
        const items: Record<string, number> = {};
        for (const [k, v] of Object.entries(r.items as Record<string, unknown>)) if (KEY.test(k) && num(v)) items[k] = clampN(v, -999, 999);
        if (Object.keys(items).length) op.items = items;
      }
      return op.coins || op.gems || op.xp || op.items ? { ok: true, op } : { ok: false, error: "Grant needs coins, gems, xp or items" };
    }
    case "stat": {
      const pick = (v: unknown, lo: number, hi: number) => {
        if (!v || typeof v !== "object") return undefined;
        const o: Partial<Record<Stat, number>> = {};
        for (const s of STATS) if ((v as Record<string, unknown>)[s] !== undefined && (v as Record<string, unknown>)[s] !== "") o[s] = clampN((v as Record<string, unknown>)[s], lo, hi);
        return Object.keys(o).length ? o : undefined;
      };
      const set = pick(r.set, 0, 100), add = pick(r.add, -100, 100);
      return set || add ? { ok: true, op: { kind: "stat", ...(set ? { set } : {}), ...(add ? { add } : {}) } } : { ok: false, error: "Pick at least one stat" };
    }
    case "message": {
      const text = cleanText(r.text, 280);
      if (!text) return { ok: false, error: "Message is empty" };
      const style = r.style === "say" || r.style === "modal" ? r.style : "toast";
      const title = cleanText(r.title, 60);
      return { ok: true, op: { kind: "message", text, style, ...(title ? { title } : {}) } };
    }
    case "anim":
      return typeof r.name === "string" && KEY.test(r.name) ? { ok: true, op: { kind: "anim", name: r.name } } : { ok: false, error: "Animation name is invalid" };
    case "flag": {
      if (typeof r.key !== "string" || !KEY.test(r.key)) return { ok: false, error: "Flag key is invalid" };
      const v = r.value;
      const value = v === null || typeof v === "boolean" || typeof v === "number" ? v : cleanText(v, 200);
      return { ok: true, op: { kind: "flag", key: r.key, value } };
    }
    case "revive":
      return { ok: true, op: { kind: "revive" } };
    default:
      return { ok: false, error: "Unknown op kind" };
  }
}

export type OpRow = {
  id: number; scope: Scope; class_id: number | null; pet_ids: string[] | null; include_new: boolean;
  created_at: string | Date; payload: OpPayload; class_rule?: ClassRule | null;
};

/** Does this op reach this pet? `all` and `class` ops skip pets born after the op unless include_new is set. */
export function opReaches(op: OpRow, pet: PetFacts): boolean {
  if (op.scope === "pets") return !!op.pet_ids?.includes(pet.id);
  if (!op.include_new && new Date(pet.createdAt).getTime() > new Date(op.created_at).getTime()) return false;
  if (op.scope === "all") return true;
  return matchesRule(op.class_rule ?? null, pet);
}

/** Postgres array literal for ids that are already validated as [A-Za-z0-9] or integers.
    Drizzle spreads JS arrays into "(a, b)" lists, so arrays go in as one literal string plus a cast. */
export function pgArray(values: (string | number)[]): string {
  return "{" + values.map(String).filter((v) => /^[A-Za-z0-9]+$/.test(v)).join(",") + "}";
}

/** One-line summary for the audit log and admin lists. */
export function describeOp(op: OpPayload): string {
  switch (op.kind) {
    case "grant": return "Grant " + [op.coins && `${op.coins} coins`, op.gems && `${op.gems} gems`, op.xp && `${op.xp} xp`, op.items && Object.entries(op.items).map(([k, v]) => `${v} ${k}`).join(", ")].filter(Boolean).join(", ");
    case "stat": return "Stats " + [op.set && "set " + Object.entries(op.set).map(([k, v]) => `${k}=${v}`).join(" "), op.add && "add " + Object.entries(op.add).map(([k, v]) => `${k}${v! >= 0 ? "+" : ""}${v}`).join(" ")].filter(Boolean).join(", ");
    case "message": return `Message (${op.style}): ${op.text.slice(0, 60)}`;
    case "anim": return `Play animation ${op.name}`;
    case "flag": return `Flag ${op.key} = ${JSON.stringify(op.value)}`;
    case "revive": return "Revive";
  }
}
