import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, products, siteSettings } from "@/db/schema";
import { PageBlock } from "@/components/page-block";
import { ProductMockup } from "@/components/product-mockup";
import type { PageBlock as PageBlockData } from "@/lib/page-blocks";
import { DEFAULT_NAVIGATION } from "@/lib/site-navigation";

export const dynamic = "force-dynamic";

async function getPage(slug: string) {
  const [page] = await getDb().select().from(pages).where(eq(pages.slug, slug));
  return page?.status === "published" ? page : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const page = await getPage((await params).slug);
    return page ? { title: page.title, alternates: { canonical: `/${page.slug}` } } : {};
  } catch {
    return {};
  }
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let page;
  let navigation = DEFAULT_NAVIGATION;
  let featuredProducts: Array<{ slug:string; name:string; imageKey:string|null; priceCents:number; collection:string; tags:string[]; colors:string[] }> = [];
  try {
    page = await getPage(slug);
    const db = getDb();
    const [[settings], catalogue] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.key, "global")),
      db.select({ slug:products.slug, name:products.name, imageKey:products.imageKey, priceCents:products.priceCents, collection:products.collection, tags:products.tags, colors:products.colors }).from(products).where(eq(products.status,"published")).orderBy(asc(products.id)).limit(6),
    ]);
    featuredProducts = catalogue;
    if (settings?.data.navigation?.length) navigation = settings.data.navigation;
  } catch {
    notFound();
  }
  if (!page) notFound();
  const blocks = Array.isArray(page.blocks) ? page.blocks as PageBlockData[] : [];
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[var(--paper)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-8 px-5 py-4 lg:px-10">
          <Link href="/loja" className="mr-auto flex items-center gap-2"><span className="grid size-10 rotate-3 place-items-center bg-[var(--brand)] text-xl font-black text-white">M</span><span className="text-xl font-black uppercase tracking-[-.055em]">Made in Maia</span></Link>
          <nav className="hidden flex-wrap gap-6 text-sm font-bold md:flex">{navigation.filter((item) => item.visible).map((item) => <Link key={item.id} href={item.url}>{item.label}</Link>)}</nav>
        </div>
      </header>
      {blocks.map((block) => <PageBlock key={block.id} block={block}>{block.type === "Produtos" ? <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{featuredProducts.map((product) => <article key={product.slug} className="text-[var(--ink)]"><Link href={`/produto/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white"><ProductMockup artwork={product.imageKey || "/products/white-shirt-1.jpg"} color={product.colors[0] ?? "White"} name={product.name} /></Link><div className="flex items-start justify-between gap-4 pt-4"><div><p className="text-sm opacity-55">{product.tags.join(" · ") || product.collection}</p><h3 className="text-xl font-black uppercase">{product.name}</h3></div><strong>{(product.priceCents/100).toFixed(2).replace(".",",")} €</strong></div></article>)}</div> : block.type === "Coleções" ? <div className="grid gap-3 sm:grid-cols-3">{["Cats","Quotes","Jars"].map((tag)=><Link key={tag} href={`/loja?q=${encodeURIComponent(tag)}`} className="rounded-full border border-black/15 bg-white px-6 py-8 text-2xl font-black uppercase">{tag}<span className="mt-2 block text-xs font-normal normal-case opacity-55">Explorar coleção</span></Link>)}</div> : undefined}</PageBlock>)}
    </main>
  );
}
