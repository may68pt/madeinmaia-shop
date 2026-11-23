// Catalog state history (written by store/[doc] on every save of "state").
//  GET            → [{ file, at, size, kind: "auto" | "day" }] newest first
//  GET ?file=name → that snapshot (JSON)
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { authorized, catalogoDir } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "cache-control": "no-store" };
const NAME = /^(r-\d+|state-\d{4}-\d{2}-\d{2})\.json$/;

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "login" }, { status: 401 });
  const dir = catalogoDir("history");
  const file = new URL(request.url).searchParams.get("file");
  if (file) {
    if (!NAME.test(file)) return NextResponse.json({ error: "file" }, { status: 400 });
    try { return new Response(await readFile(path.join(dir, file), "utf8"), { headers: { "content-type": "application/json", ...NO_STORE } }); }
    catch { return NextResponse.json({ error: "not found" }, { status: 404 }); }
  }
  const names = (await readdir(dir).catch(() => [] as string[])).filter((f) => NAME.test(f));
  const out = await Promise.all(names.map(async (f) => {
    const st = await stat(path.join(dir, f)).catch(() => null);
    const auto = f.startsWith("r-");
    return { file: f, kind: auto ? "auto" : "day", at: auto ? Number(f.slice(2, -5)) : Math.round(st?.mtimeMs || 0), size: st?.size || 0 };
  }));
  out.sort((a, b) => b.at - a.at);
  return NextResponse.json(out, { headers: NO_STORE });
}
