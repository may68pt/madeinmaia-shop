import { readFile, stat, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mediaAssets, type MediaVariant } from "@/db/schema";
import { VARIANT_WIDTHS, isCrunchable, variantFilename } from "@/lib/image-variants";

export function uploadDirectory() {
  return path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads"));
}

export function uploadsPublicBase() {
  return (process.env.UPLOADS_PUBLIC_URL || "/uploads").replace(/\/$/, "");
}

/** "/uploads/foo-1a2b.png" → "foo-1a2b.png" (only for files we host). */
export function filenameFromUrl(url: string): string | null {
  if (!isCrunchable(url)) return null;
  const name = url.split("/").pop() ?? "";
  return /^[a-z0-9-]+\.(?:png|jpe?g|webp)$/i.test(name) ? name : null;
}

let sharpReady = false;
function loadSharp() {
  if (!sharpReady) {
    // Small instance: one thread, no decoded-image cache, so memory is released after each file.
    sharp.cache(false);
    sharp.concurrency(1);
    sharpReady = true;
  }
  return sharp;
}

export type CrunchResult = { url: string; ok: boolean; error?: string; bytes?: number; variants?: MediaVariant[] };

/**
 * Makes the WebP copies of one uploaded image and records them in media_assets.
 * The original file is never changed (it is the print master).
 */
export async function crunchUpload(url: string): Promise<CrunchResult> {
  const filename = filenameFromUrl(url);
  if (!filename) return { url, ok: false, error: "Não é uma imagem da biblioteca." };
  const directory = uploadDirectory();
  const originalPath = path.join(directory, filename);
  const db = getDb();
  try {
    loadSharp();
    const input = await readFile(originalPath);
    const meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    const variants: MediaVariant[] = [];
    for (const target of VARIANT_WIDTHS) {
      const outName = variantFilename(filename, target);
      const temporary = path.join(directory, `.${outName}.tmp`);
      const { data, info } = await sharp(input, { limitInputPixels: 60_000_000 })
        .rotate()
        .resize({ width: target, height: target, fit: "inside", withoutEnlargement: true })
        .webp({ quality: target <= 160 ? 72 : 82, alphaQuality: 90, effort: 4, smartSubsample: true })
        .toBuffer({ resolveWithObject: true });
      await writeFile(temporary, data);
      await rename(temporary, path.join(directory, outName)).catch(async (error) => { await unlink(temporary).catch(() => undefined); throw error; });
      variants.push({ width: info.width, height: info.height, bytes: info.size, url: `${uploadsPublicBase()}/${outName}`, format: "webp" });
    }
    const row = {
      url,
      filename,
      format: meta.format ?? path.extname(filename).slice(1),
      width,
      height,
      bytes: input.byteLength,
      hasAlpha: meta.hasAlpha === true,
      variants,
      crunchedAt: new Date(),
      error: "",
    };
    await db.insert(mediaAssets).values(row).onConflictDoUpdate({ target: mediaAssets.url, set: row });
    return { url, ok: true, bytes: input.byteLength, variants };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Erro desconhecido";
    const bytes = await stat(originalPath).then((s) => s.size).catch(() => 0);
    await db.insert(mediaAssets)
      .values({ url, filename, bytes, error: message })
      .onConflictDoUpdate({ target: mediaAssets.url, set: { error: message, bytes } })
      .catch(() => undefined);
    return { url, ok: false, error: message };
  }
}

export async function getMediaAsset(url: string) {
  const [asset] = await getDb().select().from(mediaAssets).where(eq(mediaAssets.url, url)).limit(1);
  return asset ?? null;
}
