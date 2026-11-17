// Deploy-o-Matic → Catálogo: publish a new design into the catalog's inbox.
// POST JSON {code,name,series,theme,qrUrl,colors:[{name,hex}],image:"data:image/png;base64,..."}  (x-studio-user / x-studio-key, or app login)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authorized, catalogoDir } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function readInbox() { try { return JSON.parse(await readFile(catalogoDir("inbox.json"), "utf8")); } catch { return []; } }

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  return NextResponse.json(await readInbox(), { headers: { "cache-control": "no-store" } });
}
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || !b.image) return NextResponse.json({ error: "Falta a imagem" }, { status: 400 });
  const m = String(b.image).match(/^data:image\/(png|webp|jpeg);base64,(.+)$/);
  if (!m) return NextResponse.json({ error: "Imagem inválida" }, { status: 400 });
  await mkdir(catalogoDir("media"), { recursive: true });
  const name = `deploy-${String(b.code || "x").replace(/[^a-z0-9]/gi, "")}-${randomBytes(3).toString("hex")}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
  await writeFile(catalogoDir("media", name), Buffer.from(m[2], "base64"));
  const items = await readInbox();
  items.push({ id: randomBytes(6).toString("hex"), at: Date.now(), code: String(b.code || ""), name: String(b.name || ""), series: String(b.series || ""), theme: String(b.theme || ""), qrUrl: String(b.qrUrl || ""), colors: Array.isArray(b.colors) ? b.colors.slice(0, 3) : [], img: `/catalogo/media/${name}` });
  await writeFile(catalogoDir("inbox.json"), JSON.stringify(items));
  return NextResponse.json({ ok: true, queued: items.length });
}
export async function DELETE(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const ids = new Set((new URL(request.url).searchParams.get("ids") || "").split(",").filter(Boolean));
  const items = (await readInbox()).filter((x: { id: string }) => !ids.has(x.id));
  await writeFile(catalogoDir("inbox.json"), JSON.stringify(items));
  return NextResponse.json({ ok: true, left: items.length });
}
