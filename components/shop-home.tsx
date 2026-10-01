"use client";

import Image from "next/image";
import { ProductMockup } from "@/components/product-mockup";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Menu, Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { removeCartItem, useCart } from "@/lib/cart";
import { DEFAULT_PAGE_BLOCKS, withRequiredHomeBlocks, type PageBlock as PageBlockData } from "@/lib/page-blocks";
import { PageBlock } from "@/components/page-block";
import { LOCALES, UI_STRINGS, translatedName, type Locale } from "@/lib/i18n";
import { DEFAULT_NAVIGATION, type NavigationItem } from "@/lib/site-navigation";

type ShopProduct = { slug: string; name: string; nameTranslations:Record<string,string>; collection: string; tags:string[]; price: string; priceCents: number; image: string; colors: string[]; sizes: string[] };

const defaultProducts: ShopProduct[] = [
  { slug:"guardiao-zen", name: "Guardian Zen", nameTranslations:{pt:"Guardião Zen"}, collection: "Made in Maia", tags:["Cats"], price: "20,00 €", priceCents: 2000, image: "/products/white-shirt-1.jpg", colors:["White"], sizes:["XS","S","M","L","XL","2XL"] },
  { slug:"piramide-digital", name: "Digital Pyramid", nameTranslations:{pt:"Pirâmide Digital"}, collection: "Pop Culture", tags:["Quotes"], price: "20,00 €", priceCents: 2000, image: "/products/red-shirt-1.jpg", colors:["Red"], sizes:["XS","S","M","L","XL","2XL"] },
  { slug:"los-robots", name: "Los Robots", nameTranslations:{}, collection: "Music", tags:["Jars"], price: "20,00 €", priceCents: 2000, image: "/products/blue-shirt-1.jpg", colors:["Blue"], sizes:["XS","S","M","L","XL","2XL"] },
];

const PAGE_SIZE = 24;
export type ApiProduct = { slug:string; name:string; nameTranslations:Record<string,string>; collection:string; tags:string[]; priceCents:number; imageKey:string|null; colors:string[]; sizes:string[] };

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
    sizes: product.sizes?.length ? product.sizes : ["One size"],
  };
}

export default function Home({ initialProducts = [], initialTotal = 0, initialBlocks = DEFAULT_PAGE_BLOCKS, initialOffset = 0, initialPage = 1, initialQuery = "", navigation = DEFAULT_NAVIGATION }: { initialProducts?:ApiProduct[]; initialTotal?:number; initialBlocks?:PageBlockData[]; initialOffset?:number; initialPage?:number; initialQuery?:string; navigation?:NavigationItem[] }) {
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<ShopProduct[]>(initialProducts.map(mapProduct));
  const [blocks, setBlocks] = useState<PageBlockData[]>(withRequiredHomeBlocks(initialBlocks));
  const [locale, setLocale] = useState<Locale>("en");
  const [hasMore, setHasMore] = useState(initialOffset + initialProducts.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const firstQueryRun = useRef(true);
  const strings = UI_STRINGS[locale];
  const cart = useCart();

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
    <main className="min-h-screen bg-[var(--paper)] text-[#11110f]">
      <div className="bg-[var(--ink)] px-5 py-2 text-center text-sm font-medium tracking-wide text-white">{strings.announcement}</div>
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[var(--paper)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-5 py-4 lg:px-10">
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="bg-[var(--paper)] p-7"><SheetHeader><SheetTitle className="text-left text-2xl">Explore</SheetTitle></SheetHeader><nav className="mt-8 grid gap-5 text-lg">{navigation.filter((item) => item.visible).map((item) => <Link key={item.id} href={item.url}>{item.label}</Link>)}</nav></SheetContent>
          </Sheet>
          <a href="#" className="mr-auto flex items-center gap-2" aria-label="Made in Maia, início"><span className="grid size-10 rotate-3 place-items-center bg-[var(--brand)] text-xl font-black text-white">M</span><span className="text-xl font-black uppercase tracking-[-0.055em] sm:text-2xl">Made in Maia</span></a>
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">{navigation.filter((item) => item.visible).map((item) => <Link key={item.id} href={item.url}>{item.label}</Link>)}</nav>
          <label className="sr-only" htmlFor="language">Language</label><select id="language" value={locale} onChange={(event)=>setLocale(event.target.value as Locale)} className="bg-transparent text-xs font-black uppercase">{LOCALES.map((item)=><option key={item} value={item}>{item}</option>)}</select>
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" className="relative" size="icon" aria-label="Ver saco de compras"><ShoppingBag />{cart.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">{cart.reduce((sum,item)=>sum+item.quantity,0)}</span>}</Button></SheetTrigger>
            <SheetContent className="flex flex-col bg-[var(--paper)] p-6 sm:max-w-md"><SheetHeader><SheetTitle className="text-left text-3xl font-black uppercase tracking-tight">O teu saco</SheetTitle></SheetHeader><div className="mt-6 flex-1 space-y-3">{cart.length === 0 ? <p className="border border-dashed border-black/20 p-7 text-center text-black/55">Ainda não adicionaste nenhum design.</p> : cart.map((item) => <div key={item.key} className="flex items-center gap-4 bg-white p-3"><div className="relative size-20 overflow-hidden"><Image src={item.image} alt="" fill sizes="80px" unoptimized={item.image.startsWith("http")} className="object-cover"/></div><div><strong className="uppercase">{item.name}</strong><p className="text-sm text-black/55">{item.size} · {item.color} · {item.quantity}×</p></div><span className="ml-auto font-bold">{((item.priceCents*item.quantity)/100).toFixed(2).replace(".", ",")} €</span><Button size="icon" variant="ghost" onClick={()=>removeCartItem(item.key)} aria-label={`Remover ${item.name}`}><X className="size-4"/></Button></div>)}</div><div className="border-t border-black/15 pt-5"><div className="mb-4 flex justify-between text-lg font-bold"><span>Total</span><span>{(cart.reduce((sum,item)=>sum+item.priceCents*item.quantity,0)/100).toFixed(2).replace(".", ",")} €</span></div>{cart.length>0?<Button asChild className="h-13 w-full rounded-none bg-[var(--ink)] text-base text-white"><Link href="/checkout">Continuar para pagamento</Link></Button>:<Button disabled className="h-13 w-full rounded-none">Continuar para pagamento</Button>}<p className="mt-3 text-center text-xs text-black/50">Checkout seguro por Viva.com ou Stripe.</p></div></SheetContent>
          </Sheet>
        </div>
      </header>

      {blocks.map((block) => <PageBlock key={block.id} block={block}>{block.type === "Produtos" ? <><label className="mb-8 flex h-12 max-w-sm items-center gap-3 border border-black/20 bg-white px-4 focus-within:border-black"><Search className="size-5"/><span className="sr-only">{strings.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={strings.search} className="w-full bg-transparent text-black outline-none" /></label><div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => {const displayName=translatedName(product.name,product.nameTranslations,locale);return <article key={product.slug} className="group text-[var(--ink)]"><Link href={`/produto/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white"><ProductMockup artwork={product.image} color={product.colors[0] ?? "White"} name={displayName} /><span className="absolute left-4 top-4 bg-[var(--accent-brand)] px-3 py-1 text-xs font-black uppercase">{strings.new}</span></Link><Button asChild className="mt-[-52px] ml-4 relative z-10 rounded-none bg-[var(--ink)] text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"><Link href={`/produto/${product.slug}`}>{strings.choose}</Link></Button><div className="flex items-start justify-between gap-4 pt-4"><div><p className="text-sm opacity-55">{product.tags.join(" · ")||product.collection}</p><Link href={`/produto/${product.slug}`}><h3 className="text-xl font-black uppercase tracking-[-.025em]">{displayName}</h3></Link></div><strong className="text-lg">{product.price}</strong></div></article>})}</div>{products.length===0&&!loading&&<div className="border border-dashed border-black/25 py-16 text-center"><SlidersHorizontal className="mx-auto mb-3"/><p>No designs found.</p></div>}<div ref={loadMoreRef} className="mt-10 flex min-h-14 flex-col items-center justify-center gap-3"><p className="text-xs font-bold uppercase tracking-[.16em] text-black/45">{products.length} / {total} designs</p>{hasMore&&<Button type="button" variant="outline" disabled={loading} onClick={()=>void loadProducts(query ? products.length : initialOffset + products.length)} className="min-w-44 rounded-full">{loading?<><LoaderCircle className="animate-spin"/>Loading…</>:"Load more"}</Button>}</div><nav aria-label="Product catalogue pages" className="mt-6 flex items-center justify-center gap-4 text-sm font-bold uppercase"><Link aria-disabled={initialPage<=1} className={initialPage<=1?"pointer-events-none opacity-30":"underline"} href={initialPage<=2?"/loja":`/loja?page=${initialPage-1}`}>Previous</Link><span>Page {initialPage}</span>{initialOffset+PAGE_SIZE<total&&<Link className="underline" href={`/loja?page=${initialPage+1}`}>Next</Link>}</nav></> : block.type === "Coleções" ? <div className="grid gap-3 sm:grid-cols-3">{["Cats","Quotes","Jars"].map((tag)=><button key={tag} onClick={()=>setQuery(tag)} className="rounded-full border border-black/15 bg-white px-6 py-8 text-left text-2xl font-black uppercase transition hover:-translate-y-1 hover:border-black">{tag}<span className="mt-2 block text-xs font-normal normal-case opacity-55">{products.filter((product)=>product.tags.includes(tag)).length} designs</span></button>)}</div> : undefined}</PageBlock>)}
      <footer className="mt-10 bg-[var(--ink)] px-5 py-10 text-white lg:px-10"><div className="mx-auto flex max-w-[1440px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><strong className="text-2xl font-black uppercase tracking-[-.05em]">Made in Maia</strong><nav className="flex flex-wrap gap-5 text-sm text-white/65"><Link href="/legal/terms">Termos</Link><Link href="/legal/privacy">Privacidade</Link><Link href="/legal/returns">Trocas e devoluções</Link><Link href="/marca">A marca</Link></nav></div></footer>
    </main>
  );
}
