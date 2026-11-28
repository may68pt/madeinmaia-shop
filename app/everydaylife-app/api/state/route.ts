import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { rateLimited } from "@/lib/rate-limit";

/* Every Day — shared hive for Paulo & Luna (public/everydaylife-app/).
   One JSON document on the persistent disk. Every collection is a list of {id, u} items and
   PUT merges (union by id, newest `u` wins), so two phones never overwrite each other.
   Protected by the EVERYDAY_KEY env var (sent as the x-hive-key header). */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };
const MAX = 40_000_000; // photos ride inline in the alpha
const COLS = ["quests", "completions", "events", "messages", "achs", "claims", "votes", "tree", "rewards", "redemptions", "memories", "ledger", "profiles"] as const;

type Item = { id: string; u?: number; [k: string]: unknown };
type State = Record<(typeof COLS)[number], Item[]>;

const dataDir = process.env.EVERYDAY_DATA_DIR
  ?? (process.env.UPLOADS_DIR ? path.join(path.dirname(process.env.UPLOADS_DIR), "everyday") : path.join(process.cwd(), "data", "everyday"));
const file = path.join(dataDir, "state.json");

const json = (o: unknown, status = 200) => NextResponse.json(o, { status, headers });
const sha = (s: string) => createHash("sha256").update(s).digest();

function normalize(j: unknown): State {
  const src = (j && typeof j === "object" ? j : {}) as Record<string, unknown>;
  const o = {} as State;
  for (const k of COLS) {
    const arr = src[k];
    o[k] = Array.isArray(arr) ? (arr.filter((x) => x && typeof x === "object" && typeof (x as Item).id === "string") as Item[]) : [];
  }
  return o;
}
function merge(a: State, b: State): State {
  const out = {} as State;
  for (const k of COLS) {
    const m = new Map<string, Item>();
    for (const it of a[k]) m.set(it.id, it);
    for (const it of b[k]) { const x = m.get(it.id); if (!x || (it.u ?? 0) > (x.u ?? 0)) m.set(it.id, it); }
    out[k] = [...m.values()];
  }
  return out;
}

let cache: State | null = null;
let writing: Promise<void> = Promise.resolve();
async function load(): Promise<State> {
  if (cache) return cache;
  try { cache = normalize(JSON.parse(await fs.readFile(file, "utf8"))); } catch { cache = normalize(null); }
  return cache;
}
function persist(s: State) {
  const snapshot = JSON.stringify(s);
  writing = writing.then(async () => {
    await fs.mkdir(dataDir, { recursive: true });
    const tmp = file + ".tmp";
    await fs.writeFile(tmp, snapshot);
    await fs.rename(tmp, file);
  }).catch((e) => { console.error("[everyday] save failed", e); });
  return writing;
}

function authorized(request: Request): boolean | null {
  const key = process.env.EVERYDAY_KEY;
  if (!key) return null; // not configured yet → the app stays in local mode
  const given = request.headers.get("x-hive-key") ?? "";
  return timingSafeEqual(sha(given), sha(key));
}

export async function GET(request: Request) {
  const ok = authorized(request);
  if (ok === null) return json({ error: "sync not configured" }, 503);
  if (await rateLimited(request, "everyday-g", 120)) return json({ error: "slow down" }, 429);
  if (!ok) return json({ error: "hive key required" }, 401);
  return json({ state: await load() });
}

export async function PUT(request: Request) {
  const ok = authorized(request);
  if (ok === null) return json({ error: "sync not configured" }, 503);
  if (await rateLimited(request, "everyday-p", 120)) return json({ error: "slow down" }, 429);
  if (!ok) return json({ error: "hive key required" }, 401);
  const raw = await request.text();
  if (raw.length > MAX) return json({ error: "too big" }, 413);
  let body: { state?: unknown } | null = null;
  try { body = JSON.parse(raw || "null"); } catch { /* handled below */ }
  if (!body || typeof body.state !== "object" || body.state === null) return json({ error: "invalid" }, 400);
  const merged = merge(await load(), normalize(body.state));
  cache = merged;
  await persist(merged);
  return json({ state: merged });
}
