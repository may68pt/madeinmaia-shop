import type { MetadataRoute } from "next";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, products } from "@/db/schema";
import { collectionSlug } from "@/lib/collections";
import { LOCAL_FALLBACK_PRODUCTS } from "@/lib/fallback-products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://madeinmaia.pt";
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/loja`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/colecoes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/marca`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/linklabel`, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/links`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const [catalogue, contentPages] = await Promise.all([
      getDb().select({ slug: products.slug, updatedAt: products.updatedAt, collection: products.collection, tags: products.tags }).from(products).where(and(eq(products.status, "published"),eq(products.onlineSaleEnabled,true))),
      getDb().select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages).where(eq(pages.status, "published")),
    ]);
    const taxonomies = [...new Set(catalogue.flatMap((product) => [...product.tags, product.collection]).filter(Boolean))];
    return [
      ...staticPages,
      ...taxonomies.map((taxonomy) => ({ url: `${baseUrl}/colecao/${collectionSlug(taxonomy)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...catalogue.map((product) => ({
        url: `${baseUrl}/produto/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...contentPages.filter((page) => page.slug !== "inicio").map((page) => ({
        url: page.slug.startsWith("blog-") ? `${baseUrl}/blog/${page.slug.slice(5)}` : `${baseUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    const taxonomies = [...new Set(LOCAL_FALLBACK_PRODUCTS.flatMap((product) => [...product.tags, product.collection]))];
    return [...staticPages, ...taxonomies.map((taxonomy) => ({ url: `${baseUrl}/colecao/${collectionSlug(taxonomy)}`, changeFrequency: "weekly" as const, priority: 0.7 }))];
  }
}
