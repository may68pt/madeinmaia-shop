import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { and, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, randomContent } from "@/db/schema";
import { DiscoveryContent, type DiscoveryEntry } from "@/components/discovery-content";
import type { PageBlock } from "@/lib/page-blocks";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"Link Label", description:"Every Made in Maia label is a link. Every visit opens something different.", alternates:{canonical:"/linklabel"} };
type LinkLabelEntry = DiscoveryEntry & { id:string; linkUrl:string|null; linkLabel:string; weight:number };
function chooseWeighted(entries: LinkLabelEntry[]) { const total=entries.reduce((sum,entry)=>sum+Math.max(1,entry.weight),0);let cursor=Math.random()*total;return entries.find((entry)=>(cursor-=Math.max(1,entry.weight))<=0)??entries[0]; }

export default async function LinkLabelPage() {
  let entries:LinkLabelEntry[]=[];
  try {
    const [labels,posts]=await Promise.all([getDb().select().from(randomContent).where(eq(randomContent.active,true)),getDb().select().from(pages).where(and(like(pages.slug,"blog-%"),eq(pages.status,"published")))]);
    entries=labels.map((entry)=>({...entry,id:`label-${entry.id}`}));
    entries.push(...posts.map((post)=>{const hero=(post.blocks as PageBlock[])[0];return{id:`blog-${post.id}`,title:post.title,type:"blog",body:hero?.description??"A Made in Maia story.",category:"Journal",tags:["blog"],mediaUrl:hero?.imageUrl??null,linkUrl:`/blog/${post.slug.slice(5)}`,linkLabel:"Read story",weight:1};}));
  } catch { entries=[]; }
  const entry=chooseWeighted(entries);
  return <main id="mim-link-label" className="mim-link-label min-h-dvh bg-[#090909] text-white"><header className="mim-link-label__chrome fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-6"><Link href="/loja" className="text-xs font-black uppercase tracking-[.16em] text-white/60 hover:text-white">Made in Maia · Link Label</Link><Link href={`/linklabel?again=${crypto.randomUUID()}`} aria-label="Load another link label" className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white hover:text-black"><RefreshCw className="size-4"/></Link></header>{entry?<article className="mim-link-label__content min-h-dvh"><DiscoveryContent entry={entry}/>{entry.linkUrl&&<a href={entry.linkUrl} className="fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase text-black shadow-2xl sm:bottom-6 sm:right-6">{entry.linkLabel}<ArrowUpRight className="size-4"/></a>}</article>:<section className="grid min-h-dvh place-items-center p-8 text-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-white/40">Link Label</p><h1 className="mt-4 text-5xl font-black uppercase tracking-[-.06em]">Something is coming.</h1></div></section>}</main>;
}
