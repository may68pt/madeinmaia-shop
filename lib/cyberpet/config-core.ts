/* CyberPet live tuning values. The app fetches these from /api/petz/config, so changes land without a deploy.
   Pure data + validation: safe to import from tests, API routes and the admin UI. */

export type ConfigDef = {
  key: string; group: string; label: string; help?: string;
  type: "number" | "boolean" | "text" | "json";
  def: unknown; min?: number; max?: number;
};

export const CONFIG_DEFS: ConfigDef[] = [
  // Language (Block 10)
  { key: "lang_xp_daily_cap", group: "Language", label: "Language XP per day (cap)", type: "number", def: 60, min: 5, max: 1000 },
  { key: "lang_stage_xp", group: "Language", label: "XP needed per stage", help: "Six stages: sounds, echo, proto-words, first words, phrases, own voice", type: "json", def: [0, 120, 400, 1100, 2400, 4200] },
  { key: "lang_decay_days", group: "Language", label: "Days before an unused word starts fading", type: "number", def: 10, min: 1, max: 365 },
  { key: "lang_chatter", group: "Language", label: "How chatty (0 silent – 1 non-stop)", type: "number", def: 0.25, min: 0, max: 1 },
  // Room (Block 5) and sleep clouds (Block 6)
  { key: "room_autouse", group: "Room", label: "Pet uses items on its own (chance per minute)", type: "number", def: 0.35, min: 0, max: 1 },
  { key: "room_shake", group: "Room", label: "Shake phone for a room quake", type: "boolean", def: true },
  { key: "clouds_max", group: "Sleep clouds", label: "Max sleep clouds at once", type: "number", def: 5, min: 0, max: 12 },
  { key: "clouds_rare_chance", group: "Sleep clouds", label: "Chance a new cloud is rare", type: "number", def: 0.06, min: 0, max: 1 },
  { key: "clouds_herd_rest", group: "Sleep clouds", label: "Rest gained per cloud herded back", type: "number", def: 2, min: 0, max: 20 },
  // Glass (Block 7) and petting (Block 9)
  { key: "glass_visit_minutes", group: "Glass", label: "Away time before the pet runs to the glass (minutes)", type: "number", def: 20, min: 1, max: 1440 },
  { key: "glass_random_chance", group: "Glass", label: "Random glass visit chance per minute", type: "number", def: 0.04, min: 0, max: 1 },
  { key: "glass_daily_bond", group: "Glass", label: "Bond gained from the glass per day (cap)", type: "number", def: 12, min: 0, max: 100 },
  { key: "petting_difficulty", group: "Petting", label: "Massage game difficulty (0.5 easy – 2 hard)", type: "number", def: 1, min: 0.5, max: 2 },
  { key: "emotion_effects", group: "Emotion", label: "Moods change gameplay (+10% game coins when happy, half bond while sulking)", type: "boolean", def: true },
  { key: "emotion_sulk_seconds", group: "Emotion", label: "How long it sulks after rough handling (seconds)", type: "number", def: 45, min: 0, max: 600 },
  { key: "emotion_proud_minutes", group: "Emotion", label: "How long it stays proud after a great game (minutes)", type: "number", def: 10, min: 0, max: 120 },
  { key: "emotion_cling_minutes", group: "Emotion", label: "Time away before it gets clingy (minutes)", type: "number", def: 90, min: 5, max: 1440 },
  // Games (Block 12)
  { key: "games_open", group: "Games", label: "Rotating games open per day", type: "number", def: 4, min: 1, max: 20 },
  { key: "games_disabled", group: "Games", label: "Turned-off games", help: "List of game ids", type: "json", def: [] },
  { key: "games_forced", group: "Games", label: "Always-open games", help: "List of game ids", type: "json", def: [] },
  { key: "games_hot", group: "Games", label: "Game of the day override", help: "Game id, empty = random", type: "text", def: "" },
  // Assets (Block 4) and rig (Block 16)
  { key: "asset_sets", group: "Assets", label: "Extra sprite sets", help: "Merged over /petz/x/sets.json: { \"setName\": { \"files\": [..] } }", type: "json", def: {} },
  { key: "rig_enabled", group: "Assets", label: "Use mesh-deform rig where a rig exists", type: "boolean", def: false },
  // Shop (Block 13)
  { key: "shop_enabled", group: "Shop", label: "Rare shop open", type: "boolean", def: true },
  { key: "shop_paid_enabled", group: "Shop", label: "Paid items (Stripe)", type: "boolean", def: false },
];

const DEFS = new Map(CONFIG_DEFS.map((d) => [d.key, d]));

export function configDefaults(): Record<string, unknown> {
  return Object.fromEntries(CONFIG_DEFS.map((d) => [d.key, d.def]));
}

/** Validates one value against its definition. Returns undefined when the key is unknown or the value is invalid. */
export function cleanConfigValue(key: string, value: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  const d = DEFS.get(key);
  if (!d) return { ok: false, error: `Unknown setting ${key}` };
  if (d.type === "number") {
    const n = typeof value === "string" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n)) return { ok: false, error: `${d.label}: not a number` };
    return { ok: true, value: Math.min(d.max ?? Infinity, Math.max(d.min ?? -Infinity, n)) };
  }
  if (d.type === "boolean") return { ok: true, value: value === true || value === "true" };
  if (d.type === "text") return { ok: true, value: String(value ?? "").slice(0, 500) };
  let v = value;
  if (typeof v === "string") { try { v = JSON.parse(v); } catch { return { ok: false, error: `${d.label}: invalid JSON` }; } }
  if (JSON.stringify(v ?? null).length > 50_000) return { ok: false, error: `${d.label}: too big` };
  if (Array.isArray(d.def) !== Array.isArray(v)) return { ok: false, error: `${d.label}: expected ${Array.isArray(d.def) ? "a list" : "an object"}` };
  return { ok: true, value: v };
}
