"use client";

import { ProductCard } from "@/components/product-card";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_BLOCKS, withRequiredHomeBlocks, type PageBlock as PageBlockData } from "@/lib/page-blocks";
import { PageBlock } from "@/components/page-block";
import { LOCALES, UI_STRINGS, translatedName, type Locale } from "@/lib/i18n";
import { DEFAULT_NAVIGATION, type NavigationItem } from "@/lib/site-navigation";
import { DEFAULT_COLORS, DEFAULT_SUPPORTS, type CatalogColor, type ProductSupport } from "@/lib/product-catalog";
import type { ArtworkPlacements } from "@/lib/artwork-placement";
import { LOCAL_FALLBACK_PRODUCTS } from "@/lib/fallback-products";
import { BrandLogo } from "@/components/brand-logo";
import { LivingDesignGrid, type LivingGridProduct } from "@/components/living-design-grid";
import { StoreHeader } from "@/components/store-header";

type ShopProduct = { slug: string; name: string; nameTranslations:Record<string,string>; collection: string; tags:string[]; price: string; priceCents: number; image: string; colors: string[]; previewColorIds:string[]; sizes: string[]; monochrome:boolean; disabledSupports:string[]; artworkPlacements:ArtworkPlacements };

const defaultProducts: ShopProduct[] = LOCAL_FALLBACK_PRODUCTS.map((product) => ({
  ...product,
  previewColorIds: [],
  image: product.imageKey,
  price: `${(product.priceCents / 100).toFixed(2).replace(".", ",")} €`,
}));

const PAGE_SIZE = 24;
function stableBlockOrder(blockId:number, slug:string) { return [...`${blockId}-${slug}`].reduce((total,character)=>((total*33)+character.charCodeAt(0))>>>0,5381); }
export type ApiProduct = { slug:string; name:string; nameTranslations:Record<string,string>; collection:string; tags:string[]; priceCents:number; imageKey:string|null; colors:string[]; previewColorIds?:string[]; sizes:string[]; monochrome:boolean; disabledSupports?:string[]; artworkPlacements?:ArtworkPlacements };

function mapProduct(product: ApiProduct): ShopProduct {
  return {
    slug: product.slug,
    name: product.name,
    nameTranslations: product.nameTranslations ?? {},
    collection: product.collection,
    tags: product.tags ?? [],
    price: `${(product.priceCents / 100).toFixed(2).replace(".", ",")} €`,
    priceCents: product.priceCents,
    image: product.imageKey || "/products/white-shirt-1.jpg",
    colors: product.colors?.length ? product.colors : ["Unique"],
    previewColorIds: product.previewColorIds ?? [],
    sizes: product.sizes?.length ? product.sizes : ["One size"],
    monochrome: product.monochrome === true,
    disabledSupports: product.disabledSupports ?? [],
    artworkPlacements:product.artworkPlacements??{},
  };
}

export default function Home({ initialProducts = [], heroProducts = [], initialTotal = 0, initialBlocks = DEFAULT_PAGE_BLOCKS, initialOffset = 0, initialPage = 1, initialQuery = "", navigation = DEFAULT_NAVIGATION, catalogColors = DEFAULT_COLORS, catalogSupports = DEFAULT_SUPPORTS }: { initialProducts?:ApiProduct[]; heroProducts?:LivingGridProduct[]; initialTotal?:number; initialBlocks?:PageBlockData[]; initialOffset?:number; initialPage?:number; initialQuery?:string; navigation?:NavigationItem[]; catalogColors?:CatalogColor[]; catalogSupports?:ProductSupport[] }) {
  const [query, setQuery] = useState(initialQuery);
  const initialCatalogue = initialProducts.length ? initialProducts.map(mapProduct) : defaultProducts;
  const [products, setProducts] = useState<ShopProduct[]>(initialCatalogue);
  const [blocks, setBlocks] = useState<PageBlockData[]>(withRequiredHomeBlocks(initialBlocks));
  const [locale, setLocale] = useState<Locale>("en");
  const [hasMore, setHasMore] = useState(initialProducts.length > 0 && initialOffset + initialProducts.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal || initialCatalogue.length);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const firstQueryRun = useRef(true);
  const strings = UI_STRINGS[locale];
  const livingGridProducts:LivingGridProduct[] = heroProducts.length ? heroProducts : initialCatalogue.map(({slug,name,image,previewColorIds})=>({slug,name,imageKey:image,previewColorIds}));

  useEffect(() => {
    const stored = window.localStorage.getItem("mim-locale") as Locale | null;
    const browser = navigator.language.toLowerCase().split("-")[0] as Locale;
    const next = stored && LOCALES.includes(stored) ? stored : LOCALES.includes(browser) ? browser : "en";
    const frame = window.requestAnimationFrame(() => setLocale(next));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function productsForBlock(block: PageBlockData) {
    let items = [...products];
    if (block.productSource === "tag" && block.productTag?.trim()) {
      const tag = block.productTag.trim().toLowerCase();
      items = items.filter((product) => product.collection.toLowerCase() === tag || product.tags.some((item) => item.toLowerCase() === tag));
    } else if (block.productSource === "selection" && block.productSlugs?.length) {
      const selected = new Set(block.productSlugs);
      items = items.filter((product) => selected.has(product.slug));
    }
    if (block.productOrder === "asc") items.sort((a,b)=>a.name.localeCompare(b.name));
    if (block.productOrder === "desc") items.sort((a,b)=>b.name.localeCompare(a.name));
    if (block.productOrder === "random") items.sort((a,b)=>stableBlockOrder(block.id,a.slug)-stableBlockOrder(block.id,b.slug));
    return items.slice(0, Math.min(64, Math.max(1, block.productLimit ?? items.length)));
  }

  useEffect(() => {
    window.localStorage.setItem("mim-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const loadProducts = useCallback(async (offset: number, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (query.trim()) params.set("q", query.trim());
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json() as { products?:ApiProduct[]; total?:number; hasMore?:boolean; page?:{blocks?:PageBlockData[]}|null; storage?:string };
      if (data.page?.blocks?.length) setBlocks(withRequiredHomeBlocks(data.page.blocks));
      if (replace && data.storage === "unavailable") {
        setProducts(defaultProducts);
        setTotal(defaultProducts.length);
        setHasMore(false);
        return;
      }
      const next = (data.products ?? []).map(mapProduct);
      setProducts((current) => replace ? next : [...current, ...next.filter((item) => !current.some((existing) => existing.slug === item.slug))]);
      setTotal(data.total ?? next.length);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (firstQueryRun.current) {
      firstQueryRun.current = false;
      return;
    }
    const timeout = window.setTimeout(() => void loadProducts(0, true), 250);
    return () => window.clearTimeout(timeout);
  }, [loadProducts]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadProducts(query ? products.length : initialOffset + products.length);
    }, { rootMargin: "500px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, initialOffset, loading, loadProducts, products.length, query]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({ name: "search_products", title: "Pesquisar produtos", description: "Filtra a grelha visível da loja Made in Maia pelo nome do design.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute(input: unknown) { const value = typeof input === "object" && input && "query" in input ? String((input as { query: unknown }).query) : ""; setQuery(value); return { query: value, matches: defaultProducts.filter((product) => product.name.toLowerCase().includes(value.toLowerCase())).length }; } }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <main id="mim-shop" className="mim-shop storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
      <StoreHeader navigation={navigation} locale={locale} onLocaleChange={setLocale} announcement/>
      <section id="mim-living-hero" className="mim-living-hero border-b border-white/10 bg-[#11110f]" aria-labelledby="mim-living-hero-title">
        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 lg:px-10 lg:py-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[.24em] text-[var(--brand)]">Made in Maia live</p><h1 id="mim-living-hero-title" className="mt-1 text-2xl font-black uppercase leading-none sm:text-4xl">36 designs. Always moving.</h1></div>
            <p className="hidden max-w-sm text-right text-sm text-white/50 md:block">Top sellers lead the wall. Every tile opens the design.</p>
          </div>
          <LivingDesignGrid products={livingGridProducts} colors={catalogColors}/>
        </div>
      </section>

      {blocks.map((block) => <PageBlock key={block.id} block={block} locale={locale}>{block.type === "Produtos" ? <><label id="mim-product-search" className="mim-product-search mb-5 flex h-10 max-w-sm items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 focus-within:border-white/45 sm:mb-8 sm:h-12 sm:gap-3 sm:px-5"><Search className="size-4 sm:size-5"/><span className="sr-only">{strings.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={strings.search} className="min-w-0 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35 sm:text-base" /></label><div id={`mim-product-grid-${block.id}`} className="mim-product-grid grid grid-cols-2 gap-x-2.5 gap-y-6 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-3">{productsForBlock(block).map((product) => {const displayName=translatedName(product.name,product.nameTranslations,locale);return <ProductCard key={product.slug} product={{...product,name:displayName}} catalogColors={catalogColors} supports={catalogSupports} label={strings.new} locale={locale} strings={strings} />})}</div>{productsForBlock(block).length===0&&!loading&&<div className="mim-product-grid__empty border border-dashed border-white/20 py-16 text-center"><SlidersHorizontal className="mx-auto mb-3"/><p>{strings.noDesigns}</p></div>}<div ref={loadMoreRef} className="mim-product-grid__pagination mt-10 flex min-h-14 flex-col items-center justify-center gap-3"><p className="text-xs font-bold uppercase tracking-[.16em] text-white/45">{productsForBlock(block).length} / {total} designs</p>{hasMore&&<Button type="button" variant="outline" disabled={loading} onClick={()=>void loadProducts(query ? products.length : initialOffset + products.length)} className="min-w-44 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">{loading?<><LoaderCircle className="animate-spin"/>{strings.loading}</>:strings.loadMore}</Button>}</div><nav aria-label="Product catalogue pages" className="mim-product-grid__seo-pagination mt-6 flex items-center justify-center gap-4 text-sm font-bold uppercase"><Link aria-disabled={initialPage<=1} className={initialPage<=1?"pointer-events-none opacity-30":"underline"} href={initialPage<=2?"/loja":`/loja?page=${initialPage-1}`}>{strings.previous}</Link><span>{strings.page} {initialPage}</span>{initialOffset+PAGE_SIZE<total&&<Link className="underline" href={`/loja?page=${initialPage+1}`}>{strings.next}</Link>}</nav></> : block.type === "Coleções" ? <div className="mim-featured-collections grid gap-3 sm:grid-cols-3">{["Cats","Quotes","Jars"].map((tag)=><Link key={tag} href={`/collections/${tag.toLowerCase()}`} className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-left text-2xl font-black uppercase transition hover:-translate-y-1 hover:border-white/35 hover:bg-white/8">{tag}<span className="mt-2 block text-xs font-normal normal-case text-white/50">{products.filter((product)=>product.tags.includes(tag)).length} designs</span></Link>)}</div> : undefined}</PageBlock>)}
      <footer id="mim-site-footer" className="mim-site-footer mt-10 border-t border-white/10 bg-[var(--paper)] px-5 py-10 text-white lg:px-10"><div className="mx-auto flex max-w-[1440px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><Link href="/loja" aria-label="Made in Maia shop"><BrandLogo className="h-20 w-auto" /></Link><nav className="flex flex-wrap gap-5 text-sm text-white/65"><Link href="/legal/terms">{strings.terms}</Link><Link href="/legal/privacy">{strings.privacy}</Link><Link href="/legal/returns">{strings.returns}</Link><Link href="/marca">{strings.brand}</Link></nav></div></footer>
    </main>
  );
}
