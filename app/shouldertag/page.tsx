import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { randomContent } from "@/db/schema";
import { DiscoveryContent } from "@/components/discovery-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shoulder Tag",
  description: "Every visit reveals something different from Made in Maia.",
  alternates: { canonical: "/shouldertag" },
};

type Discovery = typeof randomContent.$inferSelect;

function chooseWeighted(entries: Discovery[]) {
  const total = entries.reduce((sum, entry) => sum + Math.max(1, entry.weight), 0);
  let cursor = Math.random() * total;
  return entries.find((entry) => (cursor -= Math.max(1, entry.weight)) <= 0) ?? entries[0];
}

export default async function ShoulderTagPage() {
  let entry: Discovery | undefined;
  try {
    const entries = await getDb().select().from(randomContent).where(eq(randomContent.active, true));
    entry = chooseWeighted(entries);
  } catch {
    entry = undefined;
  }

  const title = entry?.title ?? "You found Made in Maia.";
  const body = entry?.body ?? "Something different lives behind the shoulder tag. Reload and discover another surprise.";

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--ink)] p-4 text-white sm:p-8">
      <article className="relative w-full max-w-4xl overflow-hidden bg-[var(--brand)] p-7 sm:p-12 lg:p-16">
        <div className="absolute -right-20 -top-20 size-64 rounded-full border-[40px] border-[var(--accent-brand)]/30" />
        <Link href="/" className="relative inline-flex items-center gap-3 font-black uppercase tracking-tight">
          <span className="grid size-10 place-items-center bg-white text-[var(--ink)]">M</span> Made in Maia
        </Link>
        <div className="relative mt-20 max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.18em]"><Sparkles className="size-4"/> Shoulder tag</p>
          <h1 className="mt-5 text-5xl font-black uppercase leading-[.88] tracking-[-.06em] sm:text-7xl">{title}</h1>
          {entry ? <DiscoveryContent entry={entry} /> : <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{body}</p>}
          <div className="mt-10 flex flex-wrap gap-3">
            {entry?.linkUrl && <a href={entry.linkUrl} className="inline-flex h-12 items-center gap-2 bg-[var(--accent-brand)] px-6 font-black uppercase text-[var(--ink)]">{entry.linkLabel}<ArrowRight className="size-4"/></a>}
            <Link href="/shouldertag" className="inline-flex h-12 items-center gap-2 border border-white/40 px-6 font-bold uppercase"><RefreshCw className="size-4"/> Another surprise</Link>
          </div>
        </div>
        <p className="relative mt-20 text-xs font-bold uppercase tracking-[.2em] text-white/55">madeinmaia.pt/shouldertag</p>
      </article>
    </main>
  );
}
