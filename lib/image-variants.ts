/**
 * Crunched copies of uploaded images.
 *
 * Every raster file uploaded to /uploads gets WebP copies next to it, named
 * `<stem>-w<width>.webp`, one per width below. A copy is never upscaled: for a
 * 777 px original the "w960" and "w1600" files are 777 px wide.
 *
 * /uploads/<stem>-wNNN.webp falls back to the original while an image has not
 * been crunched yet, so these URLs are always safe to use.
 */
export const VARIANT_WIDTHS = [160, 480, 960, 1600] as const;
export type VariantWidth = (typeof VARIANT_WIDTHS)[number];

const UPLOAD_RE = /^(\/uploads\/)([a-z0-9-]+?)\.(png|jpe?g|webp)$/i;
const VARIANT_RE = /-w(?:160|480|960|1600)\.webp$/i;

/** True for an original image in /uploads that has crunched copies. */
export function isCrunchable(url: string | null | undefined): boolean {
  return Boolean(url && UPLOAD_RE.test(url) && !VARIANT_RE.test(url));
}

/** Smallest variant at least `width` pixels wide (the largest one past 1600). */
export function pickVariantWidth(width: number): VariantWidth {
  return VARIANT_WIDTHS.find((candidate) => candidate >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
}

/** URL of the crunched copy of `url` for a display `width`; other URLs are returned unchanged. */
export function variantUrl(url: string, width: number): string {
  const match = isCrunchable(url) ? url.match(UPLOAD_RE) : null;
  return match ? `${match[1]}${match[2]}-w${pickVariantWidth(width)}.webp` : url;
}

/** File name of a variant on disk, from the original's file name. */
export function variantFilename(originalFilename: string, width: VariantWidth): string {
  return `${originalFilename.replace(/\.[^.]+$/, "")}-w${width}.webp`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
