import type { Metadata } from "next";
import Link from "next/link";
import { desc, like } from "drizzle-orm";
import { ArrowRight, BookOpen } from "lucide-react";
import { getDb } from "@/db";
import { pages } from "@/db/schema";
import type { PageBlock } from "@/lib/page-blocks";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Journal | Made in Maia",
  description: "Histórias, cultura local, internet gems e ideias da Made in Maia.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  let posts: Array<typeof pages.$inferSelect> = [];
  try {
    posts = await getDb().select().from(pages).where(like(pages.slug,"blog-%")).orderBy(desc(pages.updatedAt));
    posts = posts.filter((post)=>post.status==="published");
  } catch { posts = []; }
  return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
    <header className="border-b border-white/10"><div className="mx-auto flex max-w-[1440px] items-center px-5 py-3 lg:px-10"><Link href="/loja" aria-label="Made in Maia shop"><BrandLogo className="h-16 w-auto" /></Link><Link href="/loja" className="ml-auto text-sm font-bold uppercase text-white/60">Shop</Link></div></header>
    <section className="mx-auto max-w-[1440px] px-5 py-16 lg:px-10 lg:py-24"><p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.18em] text-[var(--accent-brand)]"><BookOpen className="size-4"/>Made in Maia Journal</p><h1 className="mt-5 max-w-5xl text-6xl font-black uppercase leading-[.82] tracking-[-.07em] sm:text-8xl">Stories worth wearing.</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/60">Internet gems, local culture, curious places and the stories behind the designs.</p></section>
    <section className="mx-auto grid max-w-[1440px] gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">{posts.map((post)=>{const blocks=post.blocks as PageBlock[];const hero=blocks[0];return <article key={post.slug} className="group flex min-h-80 flex-col border border-white/10 bg-[var(--surface)] p-6 transition hover:-translate-y-1 hover:border-white/30"><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--accent-brand)]">{hero?.eyebrow||"Journal"}</p><h2 className="mt-5 text-3xl font-black uppercase leading-[.95] tracking-[-.05em]">{post.title}</h2><p className="mt-5 line-clamp-4 leading-relaxed text-white/55">{hero?.description||"A Made in Maia story."}</p><Link href={`/blog/${post.slug.slice(5)}`} className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-black uppercase">Read story<ArrowRight className="size-4 transition group-hover:translate-x-1"/></Link></article>})}{!posts.length&&<div className="col-span-full border border-dashed border-white/20 p-12 text-center"><BookOpen className="mx-auto size-10 text-white/25"/><h2 className="mt-5 text-3xl font-black uppercase">Stories are brewing.</h2><p className="mt-2 text-white/50">The first Made in Maia journal entries are coming soon.</p></div>}</section>
  </main>;
}
