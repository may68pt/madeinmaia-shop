import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { eq } from "drizzle-orm";
import { BrandLogo } from "@/components/brand-logo";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { collectionSlug } from "@/lib/collections";
import { LOCAL_FALLBACK_PRODUCTS } from "@/lib/fallback-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore every Made in Maia collection and tag.",
  alternates: { canonical: "/colecoes" },
};

type ArchiveProduct = { slug: string; name: string; collection: string; tags: string[]; imageKey: string };

export default async function CollectionsArchivePage() {
  let catalogue: ArchiveProduct[] = LOCAL_FALLBACK_PRODUCTS.map((product) => ({ slug: product.slug, name: product.name, collection: product.collection, tags: product.tags, imageKey: product.imageKey }));
  try {
    const stored = await getDb().select({ slug: products.slug, name: products.name, collection: products.collection, tags: products.tags, imageKey: products.imageKey }).from(products).where(eq(products.status, "published"));
    if (stored.length) catalogue = stored.map((product) => ({ ...product, imageKey: product.imageKey || "/products/white-shirt-1.jpg" }));
  } catch { /* Local archive uses the real-design fallback catalogue. */ }

  const names = [...new Set(catalogue.flatMap((product) => [...product.tags, product.collection]).map((name) => name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const collections = names.map((name) => {
    const matches = catalogue.filter((product) => product.collection === name || product.tags.includes(name));
    return { name, slug: collectionSlug(name), count: matches.length, preview: matches[0] };
  });
  const structuredData = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Made in Maia Collections", mainEntity: { "@type": "ItemList", numberOfItems: collections.length, itemListElement: collections.map((collection, index) => ({ "@type": "ListItem", position: index + 1, name: collection.name, url: `https://madeinmaia.pt/colecao/${collection.slug}` })) } };

  return <main id="mim-collections-archive" className="mim-collections-archive storefront-dark min-h-screen overflow-x-clip bg-[var(--paper)] text-[var(--foreground)]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <header className="mim-collections-archive__header flex min-w-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5 lg:px-10"><Link href="/loja" className="flex shrink-0 items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/><span className="hidden sm:inline">Shop</span></Link><Link href="/loja" aria-label="Made in Maia shop" className="min-w-0"><BrandLogo className="h-7 w-auto max-w-[170px] sm:h-9 sm:max-w-[230px]" /></Link></header>
    <section className="mim-collections-archive__intro mx-auto max-w-[1440px] px-4 py-12 sm:px-5 lg:px-10 lg:py-20"><p className="text-xs font-black uppercase tracking-[.18em] text-[var(--accent-brand)]">Explore by tag</p><h1 className="mt-4 max-w-5xl text-[clamp(3.2rem,10vw,8rem)] font-black uppercase leading-[.82] tracking-[-.07em]">Collections</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/55">Ideas, creatures, phrases and internet oddities. Choose a tag and enter that corner of Made in Maia.</p></section>
    <section className="mim-collections-archive__grid mx-auto grid max-w-[1440px] grid-cols-2 gap-2 px-2.5 pb-20 sm:gap-5 sm:px-5 md:grid-cols-3 lg:px-10 xl:grid-cols-4">{collections.map((collection) => <Link key={collection.slug} href={`/colecao/${collection.slug}`} className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] sm:rounded-3xl"><div className="relative aspect-square overflow-hidden" style={{backgroundImage:"radial-gradient(circle at 20% 15%,rgba(255,255,255,.13),transparent 38%),linear-gradient(145deg,#2a2a26,#111110)"}}>{collection.preview?.imageKey&&<Image src={collection.preview.imageKey} alt="" fill sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw" unoptimized={collection.preview.imageKey.startsWith("http")} className="object-contain p-[14%] transition duration-500 group-hover:scale-105"/>}</div><div className="flex min-w-0 items-start gap-2 p-3 sm:p-5"><div className="min-w-0 flex-1"><h2 className="truncate text-base font-black uppercase tracking-[-.035em] sm:text-2xl">{collection.name}</h2><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/45 sm:text-xs">{collection.count} design{collection.count===1?"":"s"}</p></div><ArrowUpRight className="size-4 shrink-0 text-[var(--accent-brand)] sm:size-5"/></div></Link>)}</section>
  </main>;
}
