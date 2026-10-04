import type { Metadata } from "next";
import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";
import Home, { type ApiProduct } from "@/components/shop-home";
import { getDb } from "@/db";
import { pages, products, siteSettings } from "@/db/schema";
import { DEFAULT_PAGE_BLOCKS, type PageBlock } from "@/lib/page-blocks";
import { DEFAULT_NAVIGATION, type NavigationItem } from "@/lib/site-navigation";
import { DEFAULT_COLORS, type CatalogColor } from "@/lib/product-catalog";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 24;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?:string; q?:string }> }): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim().slice(0,80) ?? "";
  return {
    title: query ? `${query} designs${page>1?` — Page ${page}`:""}` : page > 1 ? `Shop — Page ${page}` : "Shop",
    description: "Explore original Made in Maia designs on T-shirts, hoodies and tote bags.",
    alternates: { canonical: `/loja${query?`?q=${encodeURIComponent(query)}${page>1?`&page=${page}`:""}`:page>1?`?page=${page}`:""}` },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ page?:string; q?:string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim().slice(0,80) ?? "";
  const offset = (page - 1) * PAGE_SIZE;
  let initialProducts:ApiProduct[] = [];
  let initialTotal = 0;
  let initialBlocks:PageBlock[] = DEFAULT_PAGE_BLOCKS;
  let navigation:NavigationItem[] = DEFAULT_NAVIGATION;
  let catalogColors:CatalogColor[] = DEFAULT_COLORS;
  try {
    const db = getDb();
    const where = query
      ? and(eq(products.status,"published"),or(
          ilike(products.name,`%${query}%`),
          ilike(products.collection,`%${query}%`),
          ilike(products.designCode,`%${query}%`),
          sql`${products.tags}::text ILIKE ${`%${query}%`}`,
        ))
      : eq(products.status,"published");
    const [catalogue, [{ total }], [storedPage], [settings]] = await Promise.all([
      db.select({
        slug:products.slug,
        name:products.name,
        nameTranslations:products.nameTranslations,
        collection:products.collection,
        tags:products.tags,
        priceCents:products.priceCents,
        imageKey:products.imageKey,
        colors:products.colors,
        sizes:products.sizes,
      }).from(products).where(where).orderBy(asc(products.id)).limit(PAGE_SIZE).offset(offset),
      db.select({ total:count() }).from(products).where(where),
      db.select().from(pages).where(eq(pages.slug,"inicio")),
      db.select().from(siteSettings).where(eq(siteSettings.key,"global")),
    ]);
    initialProducts = catalogue;
    initialTotal = total;
    if (storedPage?.status === "published" && Array.isArray(storedPage.blocks))
      initialBlocks = storedPage.blocks as PageBlock[];
    if (settings?.data.navigation?.length) navigation = settings.data.navigation;
    if (settings?.data.productCatalog?.colors?.length) catalogColors = settings.data.productCatalog.colors;
  } catch {
    /* local fallback inside the client component */
  }
  const structuredData = {
    "@context":"https://schema.org",
    "@type":"ItemList",
    name:query?`Made in Maia designs: ${query}`:"Made in Maia shop",
    numberOfItems:initialTotal,
    itemListElement:initialProducts.map((product,index)=>({
      "@type":"ListItem",
      position:offset+index+1,
      url:`https://madeinmaia.pt/produto/${product.slug}`,
      name:product.name,
    })),
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/><Home initialProducts={initialProducts} initialTotal={initialTotal} initialBlocks={initialBlocks} initialOffset={offset} initialPage={page} initialQuery={query} navigation={navigation} catalogColors={catalogColors} /></>;
}
