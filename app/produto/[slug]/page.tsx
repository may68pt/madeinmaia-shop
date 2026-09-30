import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import { ProductPurchase } from "./product-purchase";

export const dynamic = "force-dynamic";

const fallback = [
  { slug:"guardiao-zen", name:"Guardião Zen", description:"Uma presença serena para dias com demasiado ruído.", priceCents:2000, collection:"Made in Maia", imageKey:"/products/white-shirt-1.jpg", colors:["Branco"], sizes:["XS","S","M","L","XL","XXL"] },
  { slug:"piramide-digital", name:"Pirâmide Digital", description:"Geometria, sinal e cultura digital numa peça direta.", priceCents:2000, collection:"Pop Culture", imageKey:"/products/red-shirt-1.jpg", colors:["Vermelho"], sizes:["XS","S","M","L","XL","XXL"] },
  { slug:"los-robots", name:"Los Robots", description:"Uma pequena homenagem às máquinas que nos ensinaram a dançar.", priceCents:2000, collection:"Música", imageKey:"/products/blue-shirt-1.jpg", colors:["Azul"], sizes:["XS","S","M","L","XL","XXL"] },
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = fallback.find((item)=>item.slug===slug);
  try {
    const [stored] = await getDb().select().from(products).where(eq(products.slug, slug));
    if (stored?.status === "published") product = { slug:stored.slug, name:stored.name, description:stored.description, priceCents:stored.priceCents, collection:stored.collection, imageKey:stored.imageKey || "/products/white-shirt-1.jpg", colors:stored.colors, sizes:stored.sizes };
  } catch { /* local fallback */ }
  if (!product) return <main className="grid min-h-screen place-items-center bg-[var(--paper)] p-8 text-center"><div><h1 className="text-5xl font-black uppercase">Produto não encontrado</h1><Link href="/" className="mt-6 inline-block underline">Voltar à loja</Link></div></main>;
  return <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]"><header className="flex items-center justify-between border-b border-black/10 px-5 py-5 lg:px-10"><Link href="/" className="flex items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/>Loja</Link><strong className="text-xl uppercase tracking-[-.05em]">Made in Maia</strong></header><section className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]"><div className="relative min-h-[55vh] bg-white lg:min-h-[calc(100vh-73px)]"><Image src={product.imageKey} alt={`T-shirt ${product.name}`} fill sizes="(min-width: 1024px) 55vw, 100vw" unoptimized={product.imageKey.startsWith("http")} className="object-cover" priority/></div><div className="flex items-center p-7 sm:p-12 lg:p-16"><div className="w-full max-w-xl"><p className="text-sm font-black uppercase tracking-[.16em] text-[var(--brand)]">{product.collection}</p><h1 className="mt-4 text-5xl font-black uppercase leading-[.9] tracking-[-.06em] sm:text-7xl">{product.name}</h1><p className="mt-6 text-2xl font-black">{(product.priceCents/100).toFixed(2).replace(".",",")} €</p><p className="mt-6 text-lg leading-relaxed text-black/60">{product.description || "Desenhada e impressa na Maia em pequenas séries."}</p><ProductPurchase slug={product.slug} name={product.name} image={product.imageKey} priceCents={product.priceCents} colors={product.colors.length?product.colors:["Única"]} sizes={product.sizes.length?product.sizes:["Único"]}/><p className="mt-6 flex items-center gap-2 text-sm text-black/55"><Truck className="size-4"/>Envio gratuito em Portugal a partir de 45 €</p></div></div></section></main>;
}
