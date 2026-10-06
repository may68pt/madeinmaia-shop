import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { products, siteSettings } from "@/db/schema";
import { ProductPurchase } from "./product-purchase";
import { ProductDiscovery, type RelatedProduct } from "@/components/product-discovery";
import { DEFAULT_COLORS, DEFAULT_SUPPORTS, normalizeSupport } from "@/lib/product-catalog";
import type { ArtworkPlacements } from "@/lib/artwork-placement";
import { LOCAL_FALLBACK_PRODUCTS } from "@/lib/fallback-products";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

type ProductView = { slug:string; name:string; nameTranslations:Record<string,string>; description:string; priceCents:number; collection:string; tags:string[]; imageKey:string; gallery:string[]; disabledSupports:string[]; monochrome:boolean; artworkPlacements:ArtworkPlacements };

const fallback: ProductView[] = LOCAL_FALLBACK_PRODUCTS;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [product] = await getDb().select().from(products).where(and(eq(products.slug, slug),eq(products.onlineSaleEnabled,true)));
    if (product?.status === "published")
      return {
        title: product.seoTitle || product.name,
        description: product.seoDescription || product.description || `${product.name}, an original Made in Maia design available on T-shirts, hoodies and tote bags.`,
        alternates: { canonical: product.seoCanonical || `/designs/${product.slug}` },
        robots: product.seoNoIndex ? { index: false, follow: false } : { index: true, follow: true },
        openGraph: {
          title: product.seoTitle || product.name,
          description: product.seoDescription || product.description || "Original Made in Maia design.",
          images: product.imageKey ? [{ url: product.imageKey, alt: product.name }] : undefined,
          type: "website",
        },
      };
  } catch {
    /* local fallback */
  }
  const localProduct = fallback.find((item) => item.slug === slug);
  if (localProduct) return {
    title: localProduct.name,
    description: localProduct.description,
    alternates: { canonical: `/designs/${localProduct.slug}` },
    openGraph: { title: localProduct.name, description: localProduct.description, images: [{ url: localProduct.imageKey, alt: localProduct.name }], type: "website" },
  };
  return { title: "Product not found", robots: { index: false, follow: false } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = fallback.find((item)=>item.slug===slug);
  let catalog = { colors: DEFAULT_COLORS, supports: DEFAULT_SUPPORTS };
  let related:RelatedProduct[] = [];
  try {
    const db = getDb();
    const [[stored], [settings]] = await Promise.all([db.select().from(products).where(and(eq(products.slug, slug),eq(products.onlineSaleEnabled,true))), db.select().from(siteSettings).where(eq(siteSettings.key,"global"))]);
    if (stored?.status === "published") product = { slug:stored.slug, name:stored.name, nameTranslations:stored.nameTranslations, description:stored.description, priceCents:stored.priceCents, collection:stored.collection, tags:stored.tags, imageKey:stored.imageKey || "/products/white-shirt-1.jpg", gallery:stored.gallery, disabledSupports:stored.disabledSupports, monochrome:stored.monochrome, artworkPlacements:stored.artworkPlacements??{} };
    if (settings?.data.productCatalog) catalog = settings.data.productCatalog;
    if (product) {
      const candidates = await db.select({
        slug:products.slug,
        name:products.name,
        imageKey:products.imageKey,
        priceCents:products.priceCents,
        collection:products.collection,
        tags:products.tags,
      }).from(products).where(and(eq(products.status,"published"),eq(products.onlineSaleEnabled,true),ne(products.slug,product.slug))).limit(48);
      const tagMatches = candidates.filter((candidate) => candidate.tags.some((tag) => product?.tags.includes(tag)));
      related = (tagMatches.length ? tagMatches : candidates).slice(0, 4);
    }
  } catch { /* local fallback */ }
  if (!product) return <main className="grid min-h-screen place-items-center bg-[var(--paper)] p-8 text-center"><div><h1 className="text-5xl font-black uppercase">Produto não encontrado</h1><Link href="/loja" className="mt-6 inline-block underline">Voltar à loja</Link></div></main>;
  const supports = catalog.supports.filter((support)=>support.id!=="sunglasses"&&support.active&&!product.disabledSupports.includes(support.id)).map(normalizeSupport);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `Original Made in Maia design: ${product.name}.`,
    image: [product.imageKey, ...product.gallery].filter(Boolean),
    brand: { "@type": "Brand", name: "Made in Maia" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (product.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `https://madeinmaia.pt/designs/${product.slug}`,
    },
  };
  return <main id={`mim-product-${product.slug}`} className="mim-product-page storefront-dark min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--foreground)]"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><header className="mim-product-page__header flex min-w-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5 lg:px-10"><Link href="/loja" className="flex shrink-0 items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/><span className="hidden sm:inline">Loja</span></Link><Link href="/loja" aria-label="Made in Maia shop" className="min-w-0"><BrandLogo className="h-16 w-auto" /></Link></header><ProductPurchase slug={product.slug} name={product.name} description={product.description} collection={product.collection} image={product.imageKey} gallery={product.gallery} priceCents={product.priceCents} supports={supports} catalogColors={catalog.colors} monochrome={product.monochrome} artworkPlacements={product.artworkPlacements}/><ProductDiscovery related={related} collection={product.tags[0] ?? product.collection}/></main>;
}
