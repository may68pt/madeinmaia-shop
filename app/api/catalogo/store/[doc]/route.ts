// Catalog documents (state, stats, prints, sales, svgs) kept on the persistent disk.
// One database for every entry point (phone app, web, Mac app). Each document carries a revision:
//  GET  → body + x-rev header;  GET ?rev=N → 204 when unchanged (cheap polling from open devices)
//  PUT  with x-base-rev → 409 + current doc if another device saved in between (client merges and retries)
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authorized, catalogoDir } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DOCS = new Set(["state", "stats", "prints", "sales", "svgs"]);
const NO_STORE = { "cache-control": "no-store" };

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
  if (doc === "state") { const day = new Date().toISOString().slice(0, 10); await writeFile(path.join(dir, "history", `state-${day}.json`), text).catch(() => undefined); }
  const rev = await revOf(file);
  return NextResponse.json({ ok: true, saved: Date.now(), rev }, { headers: { "x-rev": rev } });
}
