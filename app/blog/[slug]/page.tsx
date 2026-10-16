import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { desc, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { pages } from "@/db/schema";
import { PageBlock } from "@/components/page-block";
import type { PageBlock as PageBlockData } from "@/lib/page-blocks";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";
async function getPost(slug:string){const [post]=await getDb().select().from(pages).where(eq(pages.slug,`blog-${slug}`));return post?.status==="published"?post:null;}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{try{const {slug}=await params;const post=await getPost(slug);if(!post)return{};const hero=(post.blocks as PageBlockData[])[0];const title=hero?.seoTitle||post.title;const description=hero?.seoDescription||hero?.description||"A Made in Maia journal story.";const url=`https://madeinmaia.pt/blog/${slug}`;const image=hero?.imageUrl?new URL(hero.imageUrl,"https://madeinmaia.pt").toString():undefined;return{title,description,keywords:hero?.seoKeywords,alternates:{canonical:url},openGraph:{type:"article",url,title,description,siteName:"Made in Maia",publishedTime:post.updatedAt.toISOString(),modifiedTime:post.updatedAt.toISOString(),images:image?[{url:image,alt:hero.imageAlt||post.title}]:undefined},twitter:{card:"summary_large_image",title,description,images:image?[image]:undefined},robots:{index:true,follow:true}};}catch{return{};}}

export default async function BlogPost({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;let post;try{post=await getPost(slug);}catch{notFound();}if(!post)notFound();
  const blocks=post.blocks as PageBlockData[];
  const hero=blocks[0];
  const leadImage=blocks.find((block)=>block.imageUrl)?.imageUrl;
  let related:Array<typeof pages.$inferSelect>=[];try{const candidates=await getDb().select().from(pages).where(like(pages.slug,"blog-%")).orderBy(desc(pages.updatedAt));related=candidates.filter((item)=>item.status==="published"&&item.slug!==post.slug).sort((a,b)=>Number(((b.blocks as PageBlockData[])[0]?.eyebrow===hero?.eyebrow))-Number(((a.blocks as PageBlockData[])[0]?.eyebrow===hero?.eyebrow))).slice(0,3);}catch{}
  const url=`https://madeinmaia.pt/blog/${slug}`;
  const structured={"@context":"https://schema.org","@type":"BlogPosting",headline:post.title,description:hero?.seoDescription||hero?.description,datePublished:post.updatedAt.toISOString(),dateModified:post.updatedAt.toISOString(),inLanguage:"en",articleSection:hero?.eyebrow,keywords:hero?.seoKeywords?.join(", "),author:{"@type":"Organization",name:"Made in Maia",url:"https://madeinmaia.pt"},publisher:{"@type":"Organization",name:"Made in Maia",url:"https://madeinmaia.pt"},mainEntityOfPage:{"@type":"WebPage","@id":url},...(leadImage?{image:new URL(leadImage,"https://madeinmaia.pt").toString()}:{})};
  const breadcrumbs={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Made in Maia",item:"https://madeinmaia.pt"},{"@type":"ListItem",position:2,name:"Porto & Maia Guide",item:"https://madeinmaia.pt/blog"},{"@type":"ListItem",position:3,name:post.title,item:url}]};
  return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify([structured,breadcrumbs]).replace(/</g,"\\u003c")}}/><header className="border-b border-white/10"><div className="mx-auto flex max-w-[1100px] items-center px-5 py-3"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black uppercase"><ArrowLeft className="size-4"/>Journal</Link><Link href="/loja" className="ml-auto" aria-label="Made in Maia shop"><BrandLogo className="h-16 w-auto" /></Link></div></header><article>{blocks.map((block)=><PageBlock key={block.id} block={block} contextTitle={post.title}/>)}</article>{related.length>0&&<aside aria-labelledby="related-stories" className="mx-auto max-w-[1100px] border-t border-white/10 px-5 py-12"><p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent-brand)]">Continue exploring</p><h2 id="related-stories" className="mt-3 text-4xl font-black uppercase tracking-[-.05em]">Related local stories</h2><div className="mt-8 grid gap-px bg-white/10 sm:grid-cols-3">{related.map((item)=><Link key={item.slug} href={`/blog/${item.slug.slice(5)}`} className="bg-[var(--paper)] p-6 transition hover:bg-white/[.04]"><span className="text-xs font-black uppercase text-white/40">{(item.blocks as PageBlockData[])[0]?.eyebrow}</span><strong className="mt-3 block text-xl uppercase leading-tight">{item.title}</strong></Link>)}</div></aside>}<footer className="mx-auto max-w-[1100px] border-t border-white/10 px-5 py-12"><Link href="/blog" className="inline-flex items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/>More stories</Link></footer></main>;
}
