import { stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mediaAssets, products, siteSettings } from "@/db/schema";
import { crunchUpload, filenameFromUrl, uploadDirectory } from "@/lib/image-pipeline";
import { isCrunchable } from "@/lib/image-variants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthenticated(request: Request) {
  const expectedPassword = process.env.STUDIO_PASSWORD;
  const expectedUser = process.env.STUDIO_USERNAME || "madeinmaia";
  return Boolean(expectedPassword && request.headers.get("x-studio-user") === expectedUser && request.headers.get("x-studio-key") === expectedPassword);
}

type LibraryEntry = {
  url: string;
  usedBy: { slug: string; name: string; role: "cover" | "gallery" | "library" }[];
  crunched: boolean;
  bytes: number;
  width: number;
  height: number;
  variants: { width: number; height: number; bytes: number; url: string }[];
  variantBytes: number;
  error: string;
  missing: boolean;
};

/** Every image the shop uses (design covers, product photos, Studio library), with its crunch status. */
async function libraryReport(onlyUrl?: string) {
  const db = getDb();
  const [productRows, [settings], assets] = await Promise.all([
    db.select({ slug: products.slug, name: products.name, imageKey: products.imageKey, gallery: products.gallery }).from(products).orderBy(asc(products.sortOrder), asc(products.id)),
    db.select().from(siteSettings).where(eq(siteSettings.key, "global")),
    onlyUrl ? db.select().from(mediaAssets).where(eq(mediaAssets.url, onlyUrl)) : db.select().from(mediaAssets),
  ]);
  const entries = new Map<string, LibraryEntry>();
  const add = (url: string | null | undefined, usedBy?: LibraryEntry["usedBy"][number]) => {
    if (!url || !isCrunchable(url) || (onlyUrl && url !== onlyUrl)) return;
    const entry = entries.get(url) ?? { url, usedBy: [], crunched: false, bytes: 0, width: 0, height: 0, variants: [], variantBytes: 0, error: "", missing: false };
    if (usedBy && !entry.usedBy.some((item) => item.slug === usedBy.slug && item.role === usedBy.role)) entry.usedBy.push(usedBy);
    entries.set(url, entry);
  };
  for (const product of productRows) {
    add(product.imageKey, { slug: product.slug, name: product.name, role: "cover" });
    for (const photo of product.gallery ?? []) add(photo, { slug: product.slug, name: product.name, role: "gallery" });
  }
  for (const item of settings?.data.media ?? []) add(item.url, item.productSlug ? { slug: item.productSlug, name: item.alt || item.productSlug, role: "library" } : undefined);
  if (onlyUrl) add(onlyUrl);
  const byUrl = new Map(assets.map((asset) => [asset.url, asset]));
  const directory = uploadDirectory();
  await Promise.all([...entries.values()].map(async (entry) => {
    const asset = byUrl.get(entry.url);
    if (asset) {
      entry.crunched = Boolean(asset.crunchedAt) && asset.variants.length > 0;
      entry.bytes = asset.bytes;
      entry.width = asset.width;
      entry.height = asset.height;
      entry.variants = asset.variants.map(({ width, height, bytes, url }) => ({ width, height, bytes, url }));
      entry.variantBytes = asset.variants.reduce((sum, variant) => sum + variant.bytes, 0);
      entry.error = asset.error;
    }
    if (!entry.bytes) {
      const filename = filenameFromUrl(entry.url);
      const size = filename ? await stat(path.join(directory, filename)).then((s) => s.size).catch(() => -1) : -1;
      if (size < 0) entry.missing = true;
      else entry.bytes = size;
    }
  }));
  const list = [...entries.values()];
  const summary = {
    total: list.length,
    crunched: list.filter((entry) => entry.crunched).length,
    pending: list.filter((entry) => !entry.crunched && !entry.missing && !entry.error).length,
    failed: list.filter((entry) => !entry.crunched && entry.error).length,
    missing: list.filter((entry) => entry.missing).length,
    originalBytes: list.reduce((sum, entry) => sum + Math.max(0, entry.bytes), 0),
    // What a shopper downloads for a grid card: the 480 px copy (or the original when not crunched).
    gridBytes: list.reduce((sum, entry) => sum + (entry.variants.find((variant) => variant.url.endsWith("-w480.webp"))?.bytes ?? Math.max(0, entry.bytes)), 0),
  };
  return { summary, entries: list };
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const url = new URL(request.url).searchParams.get("url")?.trim() || undefined;
  try {
    const report = await libraryReport(url);
    return NextResponse.json(url ? { entry: report.entries[0] ?? null } : report);
  } catch {
    return NextResponse.json({ error: "Não foi possível ler a biblioteca." }, { status: 503 });
  }
}

/**
 * { action:"crunch", urls:[...] } re-crunches those files;
 * { action:"crunch-pending", limit } crunches the next few files that have no copies yet.
 * Work is done a few files per request so the small server never holds many images at once.
 */
export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { action?: string; urls?: unknown; limit?: unknown } | null;
  const limit = Math.min(4, Math.max(1, Number(body?.limit) || 3));
  let targets: string[] = [];
  if (body?.action === "crunch" && Array.isArray(body.urls)) targets = body.urls.map(String).filter((url) => isCrunchable(url)).slice(0, limit);
  else if (body?.action === "crunch-pending") {
    const report = await libraryReport().catch(() => null);
    if (!report) return NextResponse.json({ error: "Não foi possível ler a biblioteca." }, { status: 503 });
    targets = report.entries.filter((entry) => !entry.crunched && !entry.missing && !entry.error).slice(0, limit).map((entry) => entry.url);
  } else return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  const results = [];
  for (const url of targets) results.push(await crunchUpload(url));
  const report = await libraryReport().catch(() => null);
  return NextResponse.json({ results, summary: report?.summary ?? null });
}
