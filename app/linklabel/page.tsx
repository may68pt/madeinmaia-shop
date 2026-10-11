import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { and, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, randomContent } from "@/db/schema";
import { DiscoveryContent, type DiscoveryEntry } from "@/components/discovery-content";
import type { PageBlock } from "@/lib/page-blocks";
import { BrandLogo } from "@/components/brand-logo";
import { LinkLabelRedirect } from "@/components/link-label-redirect";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"Link Label", description:"Every Made in Maia label is a link. Every visit opens something different.", alternates:{canonical:"/linklabel"} };
type LinkLabelEntry = DiscoveryEntry & { id:string; linkUrl:string|null; linkLabel:string; weight:number };
const FALLBACK_ENTRY:LinkLabelEntry={id:"fallback",title:"Made in Maia is a label with a link.",type:"text",body:"Every piece carries a doorway to something unexpected — a story, an image, a video, an internet gem or a place worth finding.",category:"Link Label",tags:["made-in-maia"],mediaUrl:null,linkUrl:"/marca",linkLabel:"Meet the brand",weight:1};
function chooseWeighted(entries: LinkLabelEntry[]) { const total=entries.reduce((sum,entry)=>sum+Math.max(1,entry.weight),0);let cursor=Math.random()*total;return entries.find((entry)=>(cursor-=Math.max(1,entry.weight))<=0)??entries[0]; }

export default async function LinkLabelPage({ searchParams }: { searchParams: Promise<{ preview?:string }> }) {
  const { preview } = await searchParams;
  const previewId = Number(preview);
  let entries:LinkLabelEntry[]=[];
  try {
    if (Number.isInteger(previewId) && previewId > 0) {
      const labels=await getDb().select().from(randomContent).where(eq(randomContent.id,previewId));
      entries=labels.map((entry)=>({...entry,id:`label-${entry.id}`}));
    } else {
      const [labels,posts]=await Promise.all([getDb().select().from(randomContent).where(eq(randomContent.active,true)),getDb().select().from(pages).where(and(like(pages.slug,"blog-%"),eq(pages.status,"published")))]);
      entries=labels.map((entry)=>({...entry,id:`label-${entry.id}`}));
      entries.push(...posts.map((post)=>{const hero=(post.blocks as PageBlock[])[0];return{id:`blog-${post.id}`,title:post.title,type:"blog",body:hero?.description??"A Made in Maia story.",category:"Journal",tags:["blog"],mediaUrl:hero?.imageUrl??null,linkUrl:`/blog/${post.slug.slice(5)}`,linkLabel:"Read story",weight:1};}));
    }
  } catch { entries=[]; }
  const entry=chooseWeighted(entries)??FALLBACK_ENTRY;
  return <main id="mim-link-label" className="mim-link-label min-h-dvh bg-[#090909] text-white"><header className="mim-link-label__chrome fixed inset-x-0 top-0 z-20 flex items-center p-4 sm:p-6"><Link href="/loja" aria-label="Made in Maia shop"><BrandLogo className="h-16 w-auto sm:h-20" /></Link></header><article className="mim-link-label__content min-h-dvh"><DiscoveryContent entry={entry}/>{entry.type==="link"&&entry.linkUrl?<LinkLabelRedirect href={entry.linkUrl} title={entry.linkLabel||entry.title}/>:entry.linkUrl&&<a href={entry.linkUrl} className="fixed bottom-20 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black uppercase text-black shadow-2xl sm:bottom-24 sm:right-6">{entry.linkLabel}<ArrowUpRight className="size-4"/></a>}<Link href={`/linklabel?again=${crypto.randomUUID()}`} aria-label="Load more Link Label content" className="mim-link-label__load-more fixed bottom-4 right-4 z-30 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#d8ff42] px-5 py-3 text-sm font-black uppercase tracking-[.08em] text-black shadow-[0_12px_40px_rgba(0,0,0,.55)] transition hover:scale-[1.03] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8ff42] sm:bottom-6 sm:right-6 sm:px-6">Load more<ArrowDown className="size-4"/></Link></article></main>;
}
