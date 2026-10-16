import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { desc, like } from "drizzle-orm";
import { ArrowRight, BookOpen, Map, Search } from "lucide-react";
import { getDb } from "@/db";
import { pages } from "@/db/schema";
import type { PageBlock } from "@/lib/page-blocks";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Porto & Maia Guide",
  description: "An independent Porto and Maia knowledge base: neighbourhoods, heritage, architecture, nature, transport, markets and local stories.",
  alternates: { canonical: "/blog" },
};

function categoryOf(post:typeof pages.$inferSelect){return ((post.blocks as PageBlock[])[0]?.eyebrow||"Made in Maia Journal").trim();}

export default async function BlogPage({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}) {
  const params=await searchParams;
  const query=(params.q||"").trim().toLowerCase().slice(0,80);
  const category=(params.category||"").trim().toLowerCase().slice(0,80);
  let posts: Array<typeof pages.$inferSelect> = [];
  try {
    posts = await getDb().select().from(pages).where(like(pages.slug,"blog-%")).orderBy(desc(pages.updatedAt));
    posts = posts.filter((post)=>post.status==="published");
  } catch { posts = []; }
  const categories=[...new Set(posts.map(categoryOf))];
  const visible=posts.filter((post)=>{const hero=(post.blocks as PageBlock[])[0];const haystack=`${post.title} ${hero?.title||""} ${hero?.description||""} ${categoryOf(post)}`.toLowerCase();return(!query||haystack.includes(query))&&(!category||categoryOf(post).toLowerCase()===category);});
  const listStructured={"@context":"https://schema.org","@type":"CollectionPage",name:"Made in Maia Porto & Maia Guide",description:"Independent local knowledge for visitors to Porto and Maia.",mainEntity:{"@type":"ItemList",itemListElement:visible.map((post,index)=>({"@type":"ListItem",position:index+1,url:`https://madeinmaia.pt/blog/${post.slug.slice(5)}`,name:post.title}))}};
  return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(listStructured).replace(/</g,"\\u003c")}}/>
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-[1440px] items-center px-5 py-3 lg:px-10"><Link href="/loja" aria-label="Made in Maia shop"><BrandLogo className="h-16 w-auto" /></Link><nav className="ml-auto flex items-center gap-5 text-sm font-bold uppercase text-white/60"><Link href="/loja">Shop</Link><Link href="/linklabel">Link Label</Link></nav></div></header>
    <section className="border-b border-white/10 bg-[#11110f]"><div className="mx-auto max-w-[1440px] px-5 py-16 lg:px-10 lg:py-24"><p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.18em] text-[var(--accent-brand)]"><Map className="size-4"/>Made in Maia · Porto & Maia Guide</p><h1 className="mt-5 max-w-6xl text-6xl font-black uppercase leading-[.8] tracking-[-.07em] sm:text-8xl">Know Porto.<br/>Discover Maia.</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/60">A growing knowledge base for curious visitors: Porto routes and neighbourhoods, Maia heritage and architecture, practical transport, markets, nature and the stories that make both places feel alive.</p></div></section>
    <section className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10">
      <form action="/blog" className="flex flex-col gap-3 sm:flex-row"><label className="flex min-h-12 flex-1 items-center gap-3 border border-white/15 bg-white/5 px-4"><Search className="size-4 text-white/45"/><span className="sr-only">Search the Porto and Maia guide</span><input name="q" defaultValue={params.q} placeholder="Search places, routes and stories" className="w-full bg-transparent text-white outline-none placeholder:text-white/35"/></label><button className="min-h-12 bg-[var(--brand)] px-6 text-sm font-black uppercase text-white">Search</button></form>
      <nav aria-label="Guide categories" className="mt-5 flex flex-wrap gap-2"><Link href="/blog" className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${!category?"border-[var(--accent-brand)] text-[var(--accent-brand)]":"border-white/15 text-white/55"}`}>All guides</Link>{categories.map((item)=><Link key={item} href={`/blog?category=${encodeURIComponent(item)}`} className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${category===item.toLowerCase()?"border-[var(--accent-brand)] text-[var(--accent-brand)]":"border-white/15 text-white/55"}`}>{item}</Link>)}</nav>
    </section>
    <section className="mx-auto grid max-w-[1440px] gap-px bg-white/10 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">{visible.map((post)=>{const blocks=post.blocks as PageBlock[];const hero=blocks[0];return <article key={post.slug} className="group flex min-h-96 flex-col bg-[var(--paper)] transition hover:bg-white/[.035]">{hero?.imageUrl&&<Link href={`/blog/${post.slug.slice(5)}`} className="relative block aspect-[16/10] overflow-hidden"><Image src={hero.imageUrl} alt={hero.imageAlt??post.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105"/></Link>}<div className="flex flex-1 flex-col p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--accent-brand)]">{categoryOf(post)}</p><h2 className="mt-5 text-3xl font-black uppercase leading-[.92] tracking-[-.05em]">{post.title}</h2><p className="mt-5 line-clamp-5 leading-relaxed text-white/55">{hero?.description||"A Made in Maia Porto and Maia guide."}</p><Link href={`/blog/${post.slug.slice(5)}`} className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-black uppercase">Read guide<ArrowRight className="size-4 transition group-hover:translate-x-1"/></Link></div></article>})}{!visible.length&&<div className="col-span-full bg-[var(--paper)] p-12 text-center"><BookOpen className="mx-auto size-10 text-white/25"/><h2 className="mt-5 text-3xl font-black uppercase">No guide found.</h2><p className="mt-2 text-white/50">Try another place, topic or category.</p><Link href="/blog" className="mt-6 inline-flex border border-white/20 px-5 py-3 text-sm font-black uppercase">See all guides</Link></div>}</section>
  </main>;
}
