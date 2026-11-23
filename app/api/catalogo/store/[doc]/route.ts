// Catalog documents (state, stats, prints, sales, svgs) kept on the persistent disk.
// One database for every entry point (phone app, web, Mac app). Each document carries a revision:
//  GET  → body + x-rev header;  GET ?rev=N → 204 when unchanged (cheap polling from open devices)
//  PUT  with x-base-rev → 409 + current doc if another device saved in between (client merges and retries)
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authorized, catalogoDir } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DOCS = new Set(["state", "stats", "prints", "sales", "svgs"]);
const NO_STORE = { "cache-control": "no-store" };

/* History for undo / restore: one file per day (last save of the day, kept 90 days) plus rolling snapshots
   at most every 3 minutes while editing (last 120 kept, ≈ 6 h of active work). Listed by /api/catalogo/history. */
const RING_GAP = 3 * 60_000, RING_KEEP = 120, DAY_KEEP = 90;
async function snapshot(dir: string, text: string) {
  const hist = path.join(dir, "history"), now = new Date();
  await writeFile(path.join(hist, `state-${now.toISOString().slice(0, 10)}.json`), text);
  const files = (await readdir(hist)).sort();
  const ring = files.filter((f) => /^r-\d+\.json$/.test(f));
  const last = ring.length ? Number(ring[ring.length - 1].slice(2, -5)) : 0;
  if (now.getTime() - last >= RING_GAP) { await writeFile(path.join(hist, `r-${now.getTime()}.json`), text); ring.push(`r-${now.getTime()}.json`); }
  for (const f of ring.slice(0, Math.max(0, ring.length - RING_KEEP))) await unlink(path.join(hist, f)).catch(() => undefined);
  const cutoff = new Date(now.getTime() - DAY_KEEP * 86400_000).toISOString().slice(0, 10);
  for (const f of files.filter((f) => /^state-\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(6, 16) < cutoff)) await unlink(path.join(hist, f)).catch(() => undefined);
}

async function revOf(file: string) { try { return String(Math.round((await stat(file)).mtimeMs)); } catch { return "0"; } }

export async function GET(request: Request, { params }: { params: Promise<{ doc: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const { doc } = await params; if (!DOCS.has(doc)) return NextResponse.json({ error: "doc" }, { status: 400 });
  const file = catalogoDir(doc + ".json"), rev = await revOf(file);
  const since = new URL(request.url).searchParams.get("rev");
  if (since && since === rev) return new Response(null, { status: 204, headers: { ...NO_STORE, "x-rev": rev } });
  try { const t = await readFile(file, "utf8"); return new Response(t, { headers: { "content-type": "application/json", ...NO_STORE, "x-rev": rev } }); }
  catch { return NextResponse.json(null, { headers: { ...NO_STORE, "x-rev": "0" } }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ doc: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const { doc } = await params; if (!DOCS.has(doc)) return NextResponse.json({ error: "doc" }, { status: 400 });
  const text = await request.text();
  if (text.length > 8_000_000) return NextResponse.json({ error: "Documento grande demais" }, { status: 413 });
  try { JSON.parse(text); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const dir = catalogoDir(); await mkdir(path.join(dir, "history"), { recursive: true });
  const file = catalogoDir(doc + ".json"), tmp = file + ".tmp";
  const base = request.headers.get("x-base-rev"), cur = await revOf(file);
  if (base && cur !== "0" && base !== cur) {
    const current = await readFile(file, "utf8").catch(() => "null");
    return new Response(JSON.stringify({ conflict: true, rev: cur, doc: JSON.parse(current) }), { status: 409, headers: { "content-type": "application/json", ...NO_STORE, "x-rev": cur } });
  }
  await writeFile(tmp, text); await rename(tmp, file);
  if (doc === "state") await snapshot(dir, text).catch(() => undefined);
  const rev = await revOf(file);
  return NextResponse.json({ ok: true, saved: Date.now(), rev }, { headers: { "x-rev": rev } });
}
