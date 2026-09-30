"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { addCartItem, removeCartItem, useCart } from "@/lib/cart";

type ShopProduct = { slug: string; name: string; collection: string; price: string; priceCents: number; image: string; colors: string[]; sizes: string[] };

const defaultProducts: ShopProduct[] = [
  { slug:"guardiao-zen", name: "Guardião Zen", collection: "Made in Maia", price: "20,00 €", priceCents: 2000, image: "/products/white-shirt-1.jpg", colors:["Branco"], sizes:["XS","S","M","L","XL","XXL"] },
  { slug:"piramide-digital", name: "Piramide Digital", collection: "Pop Culture", price: "20,00 €", priceCents: 2000, image: "/products/red-shirt-1.jpg", colors:["Vermelho"], sizes:["XS","S","M","L","XL","XXL"] },
  { slug:"los-robots", name: "Los Robots", collection: "Música", price: "20,00 €", priceCents: 2000, image: "/products/blue-shirt-1.jpg", colors:["Azul"], sizes:["XS","S","M","L","XL","XXL"] },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState(defaultProducts);
  const cart = useCart();
  const visible = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    let active = true;
    void fetch("/api/products").then((response) => response.json()).then((payload: unknown) => {
      const data = payload as { products?: Array<{ slug:string; name: string; collection: string; priceCents: number; imageKey: string | null; colors: string[]; sizes:string[] }> };
      if (!active || !data.products?.length) return;
      setProducts(data.products.map((product) => ({ slug:product.slug, name: product.name, collection: product.collection, price: `${(product.priceCents / 100).toFixed(2).replace(".", ",")} €`, priceCents: product.priceCents, image: product.imageKey || "/products/white-shirt-1.jpg", colors:product.colors?.length?product.colors:["Única"], sizes:product.sizes?.length?product.sizes:["Único"] })));
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
    <main className="min-h-screen bg-[#f4f3ef] text-[#11110f]">
      <div className="bg-[#171713] px-5 py-2 text-center text-sm font-medium tracking-wide text-white">Produzido na Maia · Envio gratuito em Portugal a partir de 45 €</div>
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f4f3ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-5 py-4 lg:px-10">
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="bg-[#f4f3ef] p-7"><SheetHeader><SheetTitle className="text-left text-2xl">Explorar</SheetTitle></SheetHeader><nav className="mt-8 grid gap-5 text-lg"><a href="#novidades">Novidades</a><a href="#colecoes">Coleções</a><Link href="/descobre">Descobre</Link><Link href="/marca">A marca</Link></nav></SheetContent>
          </Sheet>
          <a href="#" className="mr-auto flex items-center gap-2" aria-label="Made in Maia, início"><span className="grid size-10 rotate-3 place-items-center bg-[#ff4f1f] text-xl font-black text-white">M</span><span className="text-xl font-black uppercase tracking-[-0.055em] sm:text-2xl">Made in Maia</span></a>
          <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex"><a href="#novidades">Novidades</a><a href="#colecoes">Coleções</a><Link href="/descobre">Descobre</Link><Link href="/marca">A marca</Link></nav>
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" className="relative" size="icon" aria-label="Ver saco de compras"><ShoppingBag />{cart.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ff4f1f] text-[11px] font-bold text-white">{cart.reduce((sum,item)=>sum+item.quantity,0)}</span>}</Button></SheetTrigger>
            <SheetContent className="flex flex-col bg-[#f4f3ef] p-6 sm:max-w-md"><SheetHeader><SheetTitle className="text-left text-3xl font-black uppercase tracking-tight">O teu saco</SheetTitle></SheetHeader><div className="mt-6 flex-1 space-y-3">{cart.length === 0 ? <p className="border border-dashed border-black/20 p-7 text-center text-black/55">Ainda não adicionaste nenhum design.</p> : cart.map((item) => <div key={item.key} className="flex items-center gap-4 bg-white p-3"><div className="relative size-20 overflow-hidden"><Image src={item.image} alt="" fill sizes="80px" unoptimized={item.image.startsWith("http")} className="object-cover"/></div><div><strong className="uppercase">{item.name}</strong><p className="text-sm text-black/55">{item.size} · {item.color} · {item.quantity}×</p></div><span className="ml-auto font-bold">{((item.priceCents*item.quantity)/100).toFixed(2).replace(".", ",")} €</span><Button size="icon" variant="ghost" onClick={()=>removeCartItem(item.key)} aria-label={`Remover ${item.name}`}><X className="size-4"/></Button></div>)}</div><div className="border-t border-black/15 pt-5"><div className="mb-4 flex justify-between text-lg font-bold"><span>Total</span><span>{(cart.reduce((sum,item)=>sum+item.priceCents*item.quantity,0)/100).toFixed(2).replace(".", ",")} €</span></div>{cart.length>0?<Button asChild className="h-13 w-full rounded-none bg-[#171713] text-base text-white"><Link href="/checkout">Continuar para pagamento</Link></Button>:<Button disabled className="h-13 w-full rounded-none">Continuar para pagamento</Button>}<p className="mt-3 text-center text-xs text-black/50">Checkout seguro por Viva.com ou Stripe.</p></div></SheetContent>
          </Sheet>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] gap-7 px-5 pb-10 pt-7 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:pt-10">
        <div className="flex min-h-[470px] flex-col justify-between overflow-hidden bg-[#ff4f1f] p-7 text-white md:p-12 lg:min-h-[600px]">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.12em]"><Sparkles className="size-4" /> Desenhos locais, atitude global</div>
          <div><h1 className="max-w-3xl text-[clamp(3.4rem,8vw,7.8rem)] font-black uppercase leading-[.78] tracking-[-.075em]">Veste uma ideia.</h1><p className="mt-7 max-w-xl text-lg leading-relaxed text-white/90">T-shirts desenhadas e impressas na Maia. Escolhe o design, a cor e o tamanho — nós tratamos do resto.</p><Button className="mt-8 h-13 rounded-none bg-[#171713] px-7 text-base text-white hover:bg-black" asChild><a href="#novidades">Ver novos designs</a></Button></div>
        </div>
        <div className="grid min-h-[470px] grid-cols-2 gap-3 bg-[#d9ff43] p-3 lg:min-h-[600px]">
          <div className="relative col-span-2 overflow-hidden bg-white"><Image src="/products/white-shirt-1.jpg" alt="T-shirt Made in Maia branca" fill sizes="(min-width: 1024px) 46vw, 100vw" loading="eager" className="object-cover" /></div>
          <div className="flex items-end bg-[#171713] p-5 text-white"><p className="text-2xl font-black uppercase leading-none">177 designs<br/>e a contar.</p></div>
          <Link href="/descobre" className="flex flex-col justify-between bg-white p-5"><span className="text-sm font-bold uppercase tracking-wider">Descobre</span><p className="text-sm leading-snug text-black/65">O símbolo abre uma surpresa diferente cada vez.</p></Link>
        </div>
      </section>

      <section id="novidades" className="mx-auto max-w-[1440px] px-5 py-10 lg:px-10 lg:py-16">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-sm font-bold uppercase tracking-[.14em] text-[#ff4f1f]">Acabados de chegar</p><h2 className="mt-2 text-4xl font-black uppercase tracking-[-.055em] md:text-6xl">Novos na loja</h2></div>
          <label className="flex h-12 min-w-[280px] items-center gap-3 border border-black/20 bg-white px-4 focus-within:border-black"><Search className="size-5"/><span className="sr-only">Pesquisar designs</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar designs" className="w-full bg-transparent outline-none" /></label>
        </div>
        <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => <article key={product.slug} className="group"><Link href={`/produto/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white"><Image src={product.image} alt={`T-shirt ${product.name}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized={product.image.startsWith("http")} className="object-cover transition duration-500 group-hover:scale-[1.03]"/><span className="absolute left-4 top-4 bg-[#d9ff43] px-3 py-1 text-xs font-black uppercase">Novo</span></Link><Button onClick={() => addCartItem({slug:product.slug,name:product.name,image:product.image,priceCents:product.priceCents,color:product.colors[0],size:product.sizes[0]})} className="mt-[-52px] ml-4 relative z-10 rounded-none bg-[#171713] text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100">Adicionar rápido</Button><div className="flex items-start justify-between gap-4 pt-4"><div><p className="text-sm text-black/55">{product.collection}</p><Link href={`/produto/${product.slug}`}><h3 className="text-xl font-black uppercase tracking-[-.025em]">{product.name}</h3></Link><p className="mt-1 text-sm text-black/55">{product.colors.join(" · ")} · {product.sizes.join("–")}</p></div><strong className="text-lg">{product.price}</strong></div></article>)}
        </div>
        {visible.length === 0 && <div className="border border-dashed border-black/25 py-16 text-center"><SlidersHorizontal className="mx-auto mb-3"/><p>Nenhum design encontrado.</p></div>}
      </section>
    </main>
  );
}
