import Image from "next/image";
import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { randomContent } from "@/db/schema";

export const dynamic = "force-dynamic";

type Discovery = typeof randomContent.$inferSelect;

function chooseWeighted(entries: Discovery[]) {
  const total = entries.reduce((sum, entry) => sum + Math.max(1, entry.weight), 0);
  let cursor = Math.random() * total;
  return entries.find((entry) => (cursor -= Math.max(1, entry.weight)) <= 0) ?? entries[0];
}

export default async function DiscoverPage() {
  let entry: Discovery | undefined;
  try {
    const entries = await getDb().select().from(randomContent).where(eq(randomContent.active, true));
    entry = chooseWeighted(entries);
  } catch {
    entry = undefined;
  }

  const title = entry?.title ?? "Hoje encontraste a Maia.";
  const body = entry?.body ?? "Uma ideia local, feita para viajar contigo. Volta amanhã — esta página está sempre a mudar.";

  return (
    <main className="grid min-h-screen place-items-center bg-[#171713] p-4 text-white sm:p-8">
      <article className="relative w-full max-w-4xl overflow-hidden bg-[#ff4f1f] p-7 sm:p-12 lg:p-16">
        <div className="absolute -right-20 -top-20 size-64 rounded-full border-[40px] border-[#d9ff43]/30" />
        <Link href="/" className="relative inline-flex items-center gap-3 font-black uppercase tracking-tight">
          <span className="grid size-10 place-items-center bg-white text-[#171713]">M</span> Made in Maia
        </Link>
        <div className="relative mt-20 max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.18em]"><Sparkles className="size-4"/> Descobre</p>
          <h1 className="mt-5 text-5xl font-black uppercase leading-[.88] tracking-[-.06em] sm:text-7xl">{title}</h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">{body}</p>
          {entry?.mediaUrl && entry.type === "image" && <div className="relative mt-8 aspect-video overflow-hidden bg-white/10"><Image src={entry.mediaUrl} alt="" fill className="object-cover" unoptimized /></div>}
          <div className="mt-10 flex flex-wrap gap-3">
            {entry?.linkUrl && <a href={entry.linkUrl} className="inline-flex h-12 items-center gap-2 bg-[#d9ff43] px-6 font-black uppercase text-[#171713]">{entry.linkLabel}<ArrowRight className="size-4"/></a>}
            <a href="/descobre" className="inline-flex h-12 items-center gap-2 border border-white/40 px-6 font-bold uppercase"><RefreshCw className="size-4"/> Outra surpresa</a>
          </div>
        </div>
        <p className="relative mt-20 text-xs font-bold uppercase tracking-[.2em] text-white/55">madeinmaia.pt/descobre</p>
      </article>
    </main>
  );
}
