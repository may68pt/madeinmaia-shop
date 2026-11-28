"use client";

import { isCrunchable, variantUrl } from "./image-variants";

/**
 * Site-wide next/image loader (next.config.ts → images.loaderFile).
 *
 * Uploaded designs are served from their pre-crunched WebP copies, so the
 * server no longer resizes images on request (that was costly in memory on the
 * 512 MB instance). Everything else is served as the file it already is.
 */
export default function mimImageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (isCrunchable(src)) return variantUrl(src, width);
  if (/^(?:https?:|data:|blob:)/i.test(src)) return src;
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
