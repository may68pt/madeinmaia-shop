import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, siteSettings } from "@/db/schema";
import { ProductPurchase } from "./product-purchase";
import { DEFAULT_COLORS, DEFAULT_SUPPORTS } from "@/lib/product-catalog";

export const dynamic = "force-dynamic";

type ProductView = { slug:string; name:string; description:string; priceCents:number; collection:string; imageKey:string; gallery:string[]; disabledSupports:string[] };

const fallback: ProductView[] = [
  { slug:"guardiao-zen", name:"Guardião Zen", description:"Uma presença serena para dias com demasiado ruído.", priceCents:2000, collection:"Made in Maia", imageKey:"/products/white-shirt-1.jpg", gallery:[], disabledSupports:[] },
  { slug:"piramide-digital", name:"Pirâmide Digital", description:"Geometria, sinal e cultura digital numa peça direta.", priceCents:2000, collection:"Pop Culture", imageKey:"/products/red-shirt-1.jpg", gallery:[], disabledSupports:[] },
  { slug:"los-robots", name:"Los Robots", description:"Uma pequena homenagem às máquinas que nos ensinaram a dançar.", priceCents:2000, collection:"Música", imageKey:"/products/blue-shirt-1.jpg", gallery:[], disabledSupports:[] },
];

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = fallback.find((item)=>item.slug===slug);
  let catalog = { colors: DEFAULT_COLORS, supports: DEFAULT_SUPPORTS };
  try {
    const db = getDb();
    const [[stored], [settings]] = await Promise.all([db.select().from(products).where(eq(products.slug, slug)), db.select().from(siteSettings).where(eq(siteSettings.key,"global"))]);
    if (stored?.status === "published") product = { slug:stored.slug, name:stored.name, description:stored.description, priceCents:stored.priceCents, collection:stored.collection, imageKey:stored.imageKey || "/products/white-shirt-1.jpg", gallery:stored.gallery, disabledSupports:stored.disabledSupports };
    if (settings?.data.productCatalog) catalog = settings.data.productCatalog;
  } catch { /* local fallback */ }
  if (!product) return <main className="grid min-h-screen place-items-center bg-[var(--paper)] p-8 text-center"><div><h1 className="text-5xl font-black uppercase">Produto não encontrado</h1><Link href="/" className="mt-6 inline-block underline">Voltar à loja</Link></div></main>;
  const supports = catalog.supports.filter((support)=>support.active&&!product.disabledSupports.includes(support.id));
  return <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]"><header className="flex items-center justify-between border-b border-black/10 px-5 py-5 lg:px-10"><Link href="/" className="flex items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/>Loja</Link><strong className="text-xl uppercase tracking-[-.05em]">Made in Maia</strong></header><ProductPurchase slug={product.slug} name={product.name} description={product.description} collection={product.collection} image={product.imageKey} gallery={product.gallery} priceCents={product.priceCents} supports={supports} catalogColors={catalog.colors}/></main>;
}
