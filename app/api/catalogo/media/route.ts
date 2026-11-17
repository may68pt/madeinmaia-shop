// Media uploads from the catalog app (designs, photos). Served back at /catalogo/media/<file>.
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authorized, catalogoDir } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "Sem ficheiro" }, { status: 400 });
  const ext = EXT[file.type]; if (!ext) return NextResponse.json({ error: "Tipo não suportado" }, { status: 415 });
  if (file.size > 60_000_000) return NextResponse.json({ error: "Ficheiro grande demais" }, { status: 413 });
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
  await mkdir(catalogoDir("media"), { recursive: true });
  await writeFile(catalogoDir("media", name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/catalogo/media/${name}`, id: name, size: file.size });
}
