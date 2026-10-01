import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, products } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://madeinmaia.pt";
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/loja`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/marca`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/shouldertag`, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/links`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const [catalogue, contentPages] = await Promise.all([
      getDb().select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.status, "published")),
      getDb().select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages).where(eq(pages.status, "published")),
    ]);
    return [
      ...staticPages,
      ...catalogue.map((product) => ({
        url: `${baseUrl}/produto/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...contentPages.filter((page) => page.slug !== "inicio").map((page) => ({
        url: `${baseUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticPages;
  }
}
