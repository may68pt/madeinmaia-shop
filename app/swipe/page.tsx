import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { DesignSwipe } from "@/components/design-swipe";
import { BrandLogo } from "@/components/brand-logo";
import { getDb } from "@/db";
import { products } from "@/db/schema";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Rate designs",description:"Browse Made in Maia designs and tell us what you love."};
export default async function SwipePage(){let catalogue:{slug:string;name:string;imageKey:string|null}[]=[];try{catalogue=await getDb().select({slug:products.slug,name:products.name,imageKey:products.imageKey}).from(products).where(and(eq(products.status,"published"),eq(products.onlineSaleEnabled,true))).orderBy(asc(products.sortOrder)).limit(160);}catch{}return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-white"><header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><Link href="/loja"><BrandLogo className="h-14 w-auto"/></Link><Link href="/loja" className="text-xs font-black uppercase">Back to shop</Link></header><DesignSwipe products={catalogue}/></main>}
