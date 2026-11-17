// Catalog documents (state, stats, prints, sales, svgs) kept on the persistent disk.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authorized, catalogoDir } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DOCS = new Set(["state", "stats", "prints", "sales", "svgs"]);

export async function GET(request: Request, { params }: { params: Promise<{ doc: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const { doc } = await params; if (!DOCS.has(doc)) return NextResponse.json({ error: "doc" }, { status: 400 });
  try { const t = await readFile(catalogoDir(doc + ".json"), "utf8"); return new Response(t, { headers: { "content-type": "application/json", "cache-control": "no-store" } }); }
  catch { return NextResponse.json(null, { headers: { "cache-control": "no-store" } }); }
}
export async function PUT(request: Request, { params }: { params: Promise<{ doc: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const { doc } = await params; if (!DOCS.has(doc)) return NextResponse.json({ error: "doc" }, { status: 400 });
  const text = await request.text();
  if (text.length > 8_000_000) return NextResponse.json({ error: "Documento grande demais" }, { status: 413 });
  try { JSON.parse(text); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const dir = catalogoDir(); await mkdir(path.join(dir, "history"), { recursive: true });
  const file = catalogoDir(doc + ".json"), tmp = file + ".tmp";
  await writeFile(tmp, text); await rename(tmp, file);
  if (doc === "state") { const day = new Date().toISOString().slice(0, 10); await writeFile(path.join(dir, "history", `state-${day}.json`), text).catch(() => undefined); }
  return NextResponse.json({ ok: true, saved: Date.now() });
}
