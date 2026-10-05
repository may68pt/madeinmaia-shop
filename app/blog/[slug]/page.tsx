import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages } from "@/db/schema";
import { PageBlock } from "@/components/page-block";
import type { PageBlock as PageBlockData } from "@/lib/page-blocks";

export const dynamic = "force-dynamic";
async function getPost(slug:string){const [post]=await getDb().select().from(pages).where(eq(pages.slug,`blog-${slug}`));return post?.status==="published"?post:null;}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{try{const post=await getPost((await params).slug);if(!post)return{};const hero=(post.blocks as PageBlockData[])[0];return{title:`${post.title} | Made in Maia`,description:hero?.description||"A Made in Maia journal story.",alternates:{canonical:`/blog/${(await params).slug}`}};}catch{return{};}}

export default async function BlogPost({params}:{params:Promise<{slug:string}>}){
  let post;try{post=await getPost((await params).slug);}catch{notFound();}if(!post)notFound();
  const blocks=post.blocks as PageBlockData[];
  const structured={"@context":"https://schema.org","@type":"BlogPosting",headline:post.title,dateModified:post.updatedAt.toISOString(),publisher:{"@type":"Organization",name:"Made in Maia"},mainEntityOfPage:`https://madeinmaia.pt/blog/${(await params).slug}`};
  return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/><header className="border-b border-white/10"><div className="mx-auto flex max-w-[1100px] items-center px-5 py-5"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black uppercase"><ArrowLeft className="size-4"/>Journal</Link><Link href="/loja" className="ml-auto font-black uppercase">Made in Maia</Link></div></header><article>{blocks.map((block)=><PageBlock key={block.id} block={block}/>)}</article><footer className="mx-auto max-w-[1100px] border-t border-white/10 px-5 py-12"><Link href="/blog" className="inline-flex items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/>More stories</Link></footer></main>;
}
