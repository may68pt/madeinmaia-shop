"use client";

import Image from "next/image";
import { ProductMockup } from "@/components/product-mockup";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { removeCartItem, useCart } from "@/lib/cart";
import { DEFAULT_PAGE_BLOCKS, withRequiredHomeBlocks, type PageBlock as PageBlockData } from "@/lib/page-blocks";
import { PageBlock } from "@/components/page-block";
import { LOCALES, UI_STRINGS, translatedName, type Locale } from "@/lib/i18n";

type ShopProduct = { slug: string; name: string; nameTranslations:Record<string,string>; collection: string; tags:string[]; price: string; priceCents: number; image: string; colors: string[]; sizes: string[] };

const defaultProducts: ShopProduct[] = [
  { slug:"guardiao-zen", name: "Guardian Zen", nameTranslations:{pt:"Guardião Zen"}, collection: "Made in Maia", tags:["Cats"], price: "20,00 €", priceCents: 2000, image: "/products/white-shirt-1.jpg", colors:["White"], sizes:["XS","S","M","L","XL","2XL"] },
  { slug:"piramide-digital", name: "Digital Pyramid", nameTranslations:{pt:"Pirâmide Digital"}, collection: "Pop Culture", tags:["Quotes"], price: "20,00 €", priceCents: 2000, image: "/products/red-shirt-1.jpg", colors:["Red"], sizes:["XS","S","M","L","XL","2XL"] },
  { slug:"los-robots", name: "Los Robots", nameTranslations:{}, collection: "Music", tags:["Jars"], price: "20,00 €", priceCents: 2000, image: "/products/blue-shirt-1.jpg", colors:["Blue"], sizes:["XS","S","M","L","XL","2XL"] },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState(defaultProducts);
  const [blocks, setBlocks] = useState<PageBlockData[]>(DEFAULT_PAGE_BLOCKS);
  const [locale, setLocale] = useState<Locale>("en");
  const strings = UI_STRINGS[locale];
  const cart = useCart();
  const visible = products.filter((product) => `${product.name} ${product.collection} ${product.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    let active = true;
    void fetch("/api/products").then((response) => response.json()).then((payload: unknown) => {
      const data = payload as { products?: Array<{ slug:string; name: string; nameTranslations:Record<string,string>; collection: string; tags:string[]; priceCents: number; imageKey: string | null; colors: string[]; sizes:string[] }>; page?: { blocks?: PageBlockData[] } | null };
      if (data.page?.blocks?.length) setBlocks(withRequiredHomeBlocks(data.page.blocks));
      if (!active || !data.products?.length) return;
      setProducts(data.products.map((product) => ({ slug:product.slug, name: product.name, nameTranslations:product.nameTranslations??{}, collection: product.collection, tags:product.tags??[], price: `${(product.priceCents / 100).toFixed(2).replace(".", ",")} €`, priceCents: product.priceCents, image: product.imageKey || "/products/white-shirt-1.jpg", colors:product.colors?.length?product.colors:["Unique"], sizes:product.sizes?.length?product.sizes:["One size"] })));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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
            <SheetContent side="left" className="bg-[var(--paper)] p-7"><SheetHeader><SheetTitle className="text-left text-2xl">Explorar</SheetTitle></SheetHeader><nav className="mt-8 grid gap-5 text-lg"><a href="#novidades">Novidades</a><a href="#colecoes">Coleções</a><Link href="/descobre">Descobre</Link><Link href="/marca">A marca</Link></nav></SheetContent>
          </Sheet>
          <a href="#" className="mr-auto flex items-center gap-2" aria-label="Made in Maia, início"><span className="grid size-10 rotate-3 place-items-center bg-[var(--brand)] text-xl font-black text-white">M</span><span className="text-xl font-black uppercase tracking-[-0.055em] sm:text-2xl">Made in Maia</span></a>
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex"><a href="#novidades">New</a><a href="#colecoes">{strings.collections}</a><Link href="/descobre">{strings.discover}</Link><Link href="/marca">{strings.brand}</Link></nav>
          <label className="sr-only" htmlFor="language">Language</label><select id="language" value={locale} onChange={(event)=>setLocale(event.target.value as Locale)} className="bg-transparent text-xs font-black uppercase">{LOCALES.map((item)=><option key={item} value={item}>{item}</option>)}</select>
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" className="relative" size="icon" aria-label="Ver saco de compras"><ShoppingBag />{cart.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">{cart.reduce((sum,item)=>sum+item.quantity,0)}</span>}</Button></SheetTrigger>
            <SheetContent className="flex flex-col bg-[var(--paper)] p-6 sm:max-w-md"><SheetHeader><SheetTitle className="text-left text-3xl font-black uppercase tracking-tight">O teu saco</SheetTitle></SheetHeader><div className="mt-6 flex-1 space-y-3">{cart.length === 0 ? <p className="border border-dashed border-black/20 p-7 text-center text-black/55">Ainda não adicionaste nenhum design.</p> : cart.map((item) => <div key={item.key} className="flex items-center gap-4 bg-white p-3"><div className="relative size-20 overflow-hidden"><Image src={item.image} alt="" fill sizes="80px" unoptimized={item.image.startsWith("http")} className="object-cover"/></div><div><strong className="uppercase">{item.name}</strong><p className="text-sm text-black/55">{item.size} · {item.color} · {item.quantity}×</p></div><span className="ml-auto font-bold">{((item.priceCents*item.quantity)/100).toFixed(2).replace(".", ",")} €</span><Button size="icon" variant="ghost" onClick={()=>removeCartItem(item.key)} aria-label={`Remover ${item.name}`}><X className="size-4"/></Button></div>)}</div><div className="border-t border-black/15 pt-5"><div className="mb-4 flex justify-between text-lg font-bold"><span>Total</span><span>{(cart.reduce((sum,item)=>sum+item.priceCents*item.quantity,0)/100).toFixed(2).replace(".", ",")} €</span></div>{cart.length>0?<Button asChild className="h-13 w-full rounded-none bg-[var(--ink)] text-base text-white"><Link href="/checkout">Continuar para pagamento</Link></Button>:<Button disabled className="h-13 w-full rounded-none">Continuar para pagamento</Button>}<p className="mt-3 text-center text-xs text-black/50">Checkout seguro por Viva.com ou Stripe.</p></div></SheetContent>
          </Sheet>
        </div>
      </header>

      {blocks.map((block) => <PageBlock key={block.id} block={block}>{block.type === "Produtos" ? <><label className="mb-8 flex h-12 max-w-sm items-center gap-3 border border-black/20 bg-white px-4 focus-within:border-black"><Search className="size-5"/><span className="sr-only">{strings.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={strings.search} className="w-full bg-transparent text-black outline-none" /></label><div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{visible.map((product) => {const displayName=translatedName(product.name,product.nameTranslations,locale);return <article key={product.slug} className="group text-[var(--ink)]"><Link href={`/produto/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white"><ProductMockup artwork={product.image} color={product.colors[0] ?? "White"} name={displayName} /><span className="absolute left-4 top-4 bg-[var(--accent-brand)] px-3 py-1 text-xs font-black uppercase">{strings.new}</span></Link><Button asChild className="mt-[-52px] ml-4 relative z-10 rounded-none bg-[var(--ink)] text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"><Link href={`/produto/${product.slug}`}>{strings.choose}</Link></Button><div className="flex items-start justify-between gap-4 pt-4"><div><p className="text-sm opacity-55">{product.tags.join(" · ")||product.collection}</p><Link href={`/produto/${product.slug}`}><h3 className="text-xl font-black uppercase tracking-[-.025em]">{displayName}</h3></Link></div><strong className="text-lg">{product.price}</strong></div></article>})}</div>{visible.length===0&&<div className="border border-dashed border-black/25 py-16 text-center"><SlidersHorizontal className="mx-auto mb-3"/><p>No designs found.</p></div>}</> : block.type === "Coleções" ? <div className="grid gap-3 sm:grid-cols-3">{["Cats","Quotes","Jars"].map((tag)=><button key={tag} onClick={()=>setQuery(tag)} className="rounded-full border border-black/15 bg-white px-6 py-8 text-left text-2xl font-black uppercase transition hover:-translate-y-1 hover:border-black">{tag}<span className="mt-2 block text-xs font-normal normal-case opacity-55">{products.filter((product)=>product.tags.includes(tag)).length} designs</span></button>)}</div> : undefined}</PageBlock>)}
      <footer className="mt-10 bg-[var(--ink)] px-5 py-10 text-white lg:px-10"><div className="mx-auto flex max-w-[1440px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><strong className="text-2xl font-black uppercase tracking-[-.05em]">Made in Maia</strong><nav className="flex flex-wrap gap-5 text-sm text-white/65"><Link href="/legal/terms">Termos</Link><Link href="/legal/privacy">Privacidade</Link><Link href="/legal/returns">Trocas e devoluções</Link><Link href="/marca">A marca</Link></nav></div></footer>
    </main>
  );
}
