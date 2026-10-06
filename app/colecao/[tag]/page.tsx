import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { PageBlock } from "@/components/page-block";
import { getDb } from "@/db";
import { pages, products, siteSettings } from "@/db/schema";
import { collectionSlug, productTaxonomies } from "@/lib/collections";
import { LOCAL_FALLBACK_PRODUCTS } from "@/lib/fallback-products";
import { UI_STRINGS } from "@/lib/i18n";
import { DEFAULT_COLORS, DEFAULT_SUPPORTS, normalizeSupport } from "@/lib/product-catalog";
import { BrandLogo } from "@/components/brand-logo";
import { DEFAULT_COLLECTION_TEMPLATE_BLOCKS, type PageBlock as PageBlockData } from "@/lib/page-blocks";

export const dynamic = "force-dynamic";

type CollectionProduct = ProductCardData & { priceCents: number };

function fallbackProducts(): CollectionProduct[] {
  return LOCAL_FALLBACK_PRODUCTS.map((product) => ({
    slug: product.slug, name: product.name, collection: product.collection, tags: product.tags,
    price: `${(product.priceCents / 100).toFixed(2).replace(".", ",")} €`, priceCents: product.priceCents,
    image: product.imageKey, colors: product.colors, monochrome: product.monochrome,
    disabledSupports: product.disabledSupports, artworkPlacements: product.artworkPlacements, previewColorIds: [],
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const name = tag.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return { title: `${name} — Collections`, description: `Explore Made in Maia designs from the ${name} collection.`, alternates: { canonical: `/collections/${tag}` } };
}

export default async function CollectionPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  let allProducts = fallbackProducts();
  let catalog = { colors: DEFAULT_COLORS, supports: DEFAULT_SUPPORTS };
  let templateBlocks = DEFAULT_COLLECTION_TEMPLATE_BLOCKS;
  try {
    const db = getDb();
    const [storedProducts, [settings], [storedTemplate]] = await Promise.all([
      db.select().from(products).where(and(eq(products.status, "published"),eq(products.onlineSaleEnabled,true))),
      db.select().from(siteSettings).where(eq(siteSettings.key, "global")),
      db.select().from(pages).where(eq(pages.slug, "collection-template")),
    ]);
    if (storedProducts.length) allProducts = storedProducts.map((product) => ({
      slug: product.slug, name: product.name, collection: product.collection, tags: product.tags,
      price: `${(product.priceCents / 100).toFixed(2).replace(".", ",")} €`, priceCents: product.priceCents,
      image: product.imageKey || "/products/white-shirt-1.jpg", colors: product.colors,
      monochrome: product.monochrome, disabledSupports: product.disabledSupports,
      artworkPlacements: product.artworkPlacements ?? {}, previewColorIds: product.previewColorIds ?? [],
    }));
    if (settings?.data.productCatalog) catalog = { ...settings.data.productCatalog, supports: settings.data.productCatalog.supports.map(normalizeSupport) };
    if (storedTemplate?.blocks?.length) templateBlocks = storedTemplate.blocks as PageBlockData[];
  } catch { /* Real-design fallbacks keep local development useful. */ }

  const taxonomyNames = [...new Set(allProducts.flatMap(productTaxonomies))].sort((a, b) => a.localeCompare(b));
  const activeName = taxonomyNames.find((name) => collectionSlug(name) === tag) ?? tag.split("-").join(" ");
  const matchingProducts = allProducts.filter((product) => productTaxonomies(product).some((name) => collectionSlug(name) === tag));
  const structuredData = { "@context": "https://schema.org", "@type": "ItemList", name: `${activeName} — Made in Maia`, numberOfItems: matchingProducts.length, itemListElement: matchingProducts.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: `https://madeinmaia.pt/designs/${product.slug}`, name: product.name })) };
  const applyTokens = (value = "") => value.replaceAll("{{collection}}", activeName).replaceAll("{{tag}}", tag).replaceAll("{{count}}", String(matchingProducts.length));
  const archiveBlocks:PageBlockData[] = templateBlocks.map((block):PageBlockData => ({ ...block, eyebrow:applyTokens(block.eyebrow), title:applyTokens(block.title), description:applyTokens(block.description), ctaLabel:applyTokens(block.ctaLabel), ctaUrl:applyTokens(block.ctaUrl) }));
  if (!archiveBlocks.some((block) => block.type === "Produtos")) archiveBlocks.push(DEFAULT_COLLECTION_TEMPLATE_BLOCKS[1]);
  const taxonomyNav = <nav aria-label="Other collections and tags" className="mim-collection-page__taxonomy-nav flex flex-wrap gap-2">{taxonomyNames.map((name) => <Link key={name} href={`/collections/${collectionSlug(name)}`} aria-current={collectionSlug(name) === tag ? "page" : undefined} className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide transition ${collectionSlug(name) === tag ? "border-[var(--accent-brand)] bg-[var(--accent-brand)] text-black" : "border-white/15 bg-white/5 text-white hover:border-white/45"}`}>{name}</Link>)}</nav>;
  const productGrid = matchingProducts.length ? <div className="mim-product-grid grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-3">{matchingProducts.map((product) => <ProductCard key={product.slug} product={product} catalogColors={catalog.colors} supports={catalog.supports} strings={UI_STRINGS.en} label="" />)}</div> : <div className="rounded-3xl border border-dashed border-white/20 p-12 text-center text-white/55">No published designs in this collection yet.</div>;

  return <main id={`mim-collection-${tag}`} className="mim-collection-page storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <header className="mim-collection-page__header flex min-w-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5 lg:px-10"><Link href="/loja" className="flex shrink-0 items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/><span className="hidden sm:inline">Shop</span></Link><Link href="/loja" aria-label="Made in Maia shop" className="min-w-0"><BrandLogo className="h-16 w-auto" /></Link></header>
    {archiveBlocks.map((block) => <PageBlock key={block.id} block={block}>{block.type === "Hero" ? taxonomyNav : block.type === "Produtos" ? productGrid : undefined}</PageBlock>)}
  </main>;
}
