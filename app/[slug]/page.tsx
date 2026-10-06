import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, products, siteSettings } from "@/db/schema";
import { BrandLogo } from "@/components/brand-logo";
import { PageBlock } from "@/components/page-block";
import { ProductMockup } from "@/components/product-mockup";
import type { PageBlock as PageBlockData } from "@/lib/page-blocks";
import { DEFAULT_NAVIGATION } from "@/lib/site-navigation";

export const dynamic="force-dynamic";
type FeaturedProduct={slug:string;name:string;imageKey:string|null;priceCents:number;collection:string;tags:string[];colors:string[]};

async function getPage(slug:string){const [page]=await getDb().select().from(pages).where(eq(pages.slug,slug));return page?.status==="published"?page:null;}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{try{const page=await getPage((await params).slug);return page?{title:page.title,alternates:{canonical:`/${page.slug}`}}:{};}catch{return{};}}

function productsForBlock(block:PageBlockData,catalogue:FeaturedProduct[]){
  let items=[...catalogue];
  if(block.productSource==="tag"&&block.productTag){const tag=block.productTag.toLowerCase();items=items.filter((product)=>product.collection.toLowerCase()===tag||product.tags.some((item)=>item.toLowerCase()===tag));}
  if(block.productSource==="selection"&&block.productSlugs?.length){const selected=new Set(block.productSlugs);items=items.filter((product)=>selected.has(product.slug));}
  if(block.productOrder==="asc")items.sort((a,b)=>a.name.localeCompare(b.name));
  if(block.productOrder==="desc")items.sort((a,b)=>b.name.localeCompare(a.name));
  return items.slice(0,Math.min(64,Math.max(1,block.productLimit??6)));
}

export default async function CmsPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;let page;let navigation=DEFAULT_NAVIGATION;let catalogue:FeaturedProduct[]=[];
  try {page=await getPage(slug);const db=getDb();const [[settings],stored]=await Promise.all([db.select().from(siteSettings).where(eq(siteSettings.key,"global")),db.select({slug:products.slug,name:products.name,imageKey:products.imageKey,priceCents:products.priceCents,collection:products.collection,tags:products.tags,colors:products.colors}).from(products).where(eq(products.status,"published")).orderBy(asc(products.sortOrder),asc(products.id)).limit(64)]);catalogue=stored;if(settings?.data.navigation?.length)navigation=settings.data.navigation;} catch {notFound();}
  if(!page)notFound();const blocks=Array.isArray(page.blocks)?page.blocks as PageBlockData[]:[];
  return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[var(--paper)]/95 backdrop-blur"><div className="mx-auto flex max-w-[1440px] items-center gap-8 px-5 py-3 lg:px-10"><Link href="/loja" className="mr-auto"><BrandLogo className="h-16 w-auto"/></Link><nav className="hidden flex-wrap gap-6 text-sm font-bold md:flex">{navigation.filter((item)=>item.visible).map((item)=><Link key={item.id} href={item.id==="discover"?"/linklabel":item.url}>{item.label}</Link>)}</nav></div></header>
    {blocks.map((block)=><PageBlock key={block.id} block={block} contextTitle={page.title}>{block.type==="Produtos"?<div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-5 lg:grid-cols-3">{productsForBlock(block,catalogue).map((product)=><article key={product.slug} className="min-w-0 text-[var(--foreground)]"><Link href={`/designs/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white"><ProductMockup artwork={product.imageKey||"/products/white-shirt-1.jpg"} color={product.colors[0]??"White"} name={product.name}/></Link><div className="flex items-start justify-between gap-2 pt-3"><div className="min-w-0"><p className="truncate text-xs text-white/50">{product.tags.join(" · ")||product.collection}</p><h3 className="line-clamp-2 font-black uppercase sm:text-xl">{product.name}</h3></div><strong className="shrink-0">{(product.priceCents/100).toFixed(2).replace(".",",")} €</strong></div></article>)}</div>:block.type==="Coleções"?<div className="grid gap-3 sm:grid-cols-3">{["Cats","Quotes","Jars"].map((tag)=><Link key={tag} href={`/collections/${tag.toLowerCase()}`} className="rounded-3xl border border-white/15 bg-white/5 px-6 py-8 text-2xl font-black uppercase">{tag}<span className="mt-2 block text-xs font-normal normal-case text-white/55">Explorar coleção</span></Link>)}</div>:undefined}</PageBlock>)}
  </main>;
}
