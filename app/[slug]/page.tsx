import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, siteSettings } from "@/db/schema";
import { PageBlock } from "@/components/page-block";
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
  try {
    page = await getPage(slug);
    const [settings] = await getDb().select().from(siteSettings).where(eq(siteSettings.key, "global"));
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
      {blocks.map((block) => <PageBlock key={block.id} block={block} />)}
    </main>
  );
}

