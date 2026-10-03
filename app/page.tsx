import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Camera, Sparkles, Users } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Made in Maia — Coming soon",
  description: "Original designs, made in Maia. Our new online shop is coming soon.",
  alternates: { canonical: "/" },
};

export default async function ComingSoonPage() {
  let instagram = "https://instagram.com";
  let facebook = "https://facebook.com";
  let splash = {
    enabled: true,
    eyebrow: "New online shop",
    title: "Coming\nsoon.",
    description: "Original designs, printed locally and made to travel. The new Made in Maia shop is almost here.",
    shoulderTagLabel: "Try the shoulder tag",
  };
  try {
    const [settings] = await getDb().select().from(siteSettings).where(eq(siteSettings.key, "global"));
    if (settings) {
      instagram = settings.data.instagramUrl || instagram;
      facebook = settings.data.facebookUrl || facebook;
      splash = { ...splash, ...settings.data.launchSplash };
    }
  } catch {
    /* local fallback */
  }
  if (!splash.enabled) redirect("/loja");

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[var(--ink)] p-5 text-white sm:p-8">
      <div className="absolute -right-24 -top-24 size-[28rem] rounded-full border-[5rem] border-[var(--accent-brand)]/15" />
      <div className="absolute -bottom-44 -left-32 size-[30rem] rounded-full bg-[var(--brand)]/20 blur-3xl" />
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col justify-between">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-black uppercase tracking-tight">
            <span className="grid size-12 rotate-3 place-items-center bg-[var(--brand)] text-2xl">M</span>
            <span className="text-xl">Made in Maia</span>
          </div>
          <Link href="/shouldertag" className="hidden items-center gap-2 text-sm font-bold uppercase sm:flex">
            <Sparkles className="size-4 text-[var(--accent-brand)]" /> {splash.shoulderTagLabel}
          </Link>
        </header>

        <section className="max-w-5xl py-20 sm:py-28">
          <p className="text-sm font-black uppercase tracking-[.24em] text-[var(--accent-brand)]">{splash.eyebrow}</p>
          <h1 className="mt-5 whitespace-pre-line text-[clamp(4.5rem,15vw,12rem)] font-black uppercase leading-[.72] tracking-[-.075em]">
            {splash.title}
          </h1>
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-white/65 sm:text-2xl">
            {splash.description}
          </p>
        </section>

        <footer className="flex flex-col gap-5 border-t border-white/15 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white hover:text-[var(--ink)]"><Camera /></a>
            <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white hover:text-[var(--ink)]"><Users /></a>
            <Link href="/links" aria-label="All Made in Maia links" className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white hover:text-[var(--ink)]"><ArrowUpRight /></Link>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-bold uppercase tracking-[.16em] text-white/55">
            <Link href="/shouldertag">Random content</Link>
            <Link href="/marca">About the brand</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
