import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { products, siteSettings } from "@/db/schema";
import { ProductPurchase } from "./product-purchase";
import { ProductDiscovery, type RelatedProduct } from "@/components/product-discovery";
import { DEFAULT_COLORS, DEFAULT_SUPPORTS, normalizeSupport } from "@/lib/product-catalog";

export const dynamic = "force-dynamic";

type ProductView = { slug:string; name:string; nameTranslations:Record<string,string>; description:string; priceCents:number; collection:string; tags:string[]; imageKey:string; gallery:string[]; disabledSupports:string[]; monochrome:boolean };

const fallback: ProductView[] = [
  { slug:"guardiao-zen", name:"Guardian Zen", nameTranslations:{pt:"Guardião Zen"}, description:"A calm presence for noisy days.", priceCents:2000, collection:"Made in Maia", tags:["Cats"], imageKey:"/products/white-shirt-1.jpg", gallery:[], disabledSupports:[], monochrome:true },
  { slug:"piramide-digital", name:"Digital Pyramid", nameTranslations:{pt:"Pirâmide Digital"}, description:"Geometry, signal and digital culture.", priceCents:2000, collection:"Pop Culture", tags:["Quotes"], imageKey:"/products/red-shirt-1.jpg", gallery:[], disabledSupports:[], monochrome:true },
  { slug:"los-robots", name:"Los Robots", nameTranslations:{}, description:"A small tribute to the machines that taught us to dance.", priceCents:2000, collection:"Music", tags:["Jars"], imageKey:"/products/blue-shirt-1.jpg", gallery:[], disabledSupports:[], monochrome:false },
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [product] = await getDb().select().from(products).where(eq(products.slug, slug));
    if (product?.status === "published")
      return {
        title: product.name,
        description: product.description || `${product.name}, an original Made in Maia design available on T-shirts, hoodies and tote bags.`,
        alternates: { canonical: `/produto/${product.slug}` },
        openGraph: {
          title: product.name,
          description: product.description || "Original Made in Maia design.",
          images: product.imageKey ? [{ url: product.imageKey, alt: product.name }] : undefined,
          type: "website",
        },
      };
  } catch {
    /* local fallback */
  }
  return { title: "Product not found", robots: { index: false, follow: false } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = fallback.find((item)=>item.slug===slug);
  let catalog = { colors: DEFAULT_COLORS, supports: DEFAULT_SUPPORTS };
  let related:RelatedProduct[] = [];
  try {
    const db = getDb();
    const [[stored], [settings]] = await Promise.all([db.select().from(products).where(eq(products.slug, slug)), db.select().from(siteSettings).where(eq(siteSettings.key,"global"))]);
    if (stored?.status === "published") product = { slug:stored.slug, name:stored.name, nameTranslations:stored.nameTranslations, description:stored.description, priceCents:stored.priceCents, collection:stored.collection, tags:stored.tags, imageKey:stored.imageKey || "/products/white-shirt-1.jpg", gallery:stored.gallery, disabledSupports:stored.disabledSupports, monochrome:stored.monochrome };
    if (settings?.data.productCatalog) catalog = settings.data.productCatalog;
    if (product) {
      const candidates = await db.select({
        slug:products.slug,
        name:products.name,
        imageKey:products.imageKey,
        priceCents:products.priceCents,
        collection:products.collection,
        tags:products.tags,
      }).from(products).where(and(eq(products.status,"published"),ne(products.slug,product.slug))).limit(48);
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
      url: `https://madeinmaia.pt/produto/${product.slug}`,
    },
  };
  return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><header className="flex items-center justify-between border-b border-white/10 px-5 py-5 lg:px-10"><Link href="/loja" className="flex items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/>Loja</Link><strong className="text-xl uppercase tracking-[-.05em]">Made in Maia</strong></header><ProductPurchase slug={product.slug} name={product.name} description={product.description} collection={product.collection} image={product.imageKey} gallery={product.gallery} priceCents={product.priceCents} supports={supports} catalogColors={catalog.colors} monochrome={product.monochrome}/><ProductDiscovery related={related} collection={product.tags[0] ?? product.collection}/></main>;
}
