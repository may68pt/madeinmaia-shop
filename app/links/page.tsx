import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  let instagram="https://instagram.com"; let facebook="https://facebook.com"; let email="hello@madeinmaia.pt";
  try { const [settings]=await getDb().select().from(siteSettings).where(eq(siteSettings.key,"global")); if(settings){instagram=settings.data.instagramUrl||instagram;facebook=settings.data.facebookUrl||facebook;email=settings.data.contactEmail||email;} } catch { /* local fallback */ }
  const links=[
    ["Instagram",instagram],["Facebook",facebook],["Join the team",`mailto:${email}?subject=Join%20Made%20in%20Maia`],["Markets & events","https://rivermarket.pt"],
  ];
  return <main className="min-h-screen bg-[var(--accent-brand)] p-5 text-[var(--ink)]"><div className="mx-auto max-w-2xl py-10"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-black uppercase"><ArrowLeft className="size-4"/>Shop</Link><div className="grid size-20 rotate-3 place-items-center bg-[var(--brand)] text-4xl font-black text-white">M</div><p className="mt-8 text-sm font-black uppercase tracking-[.16em]">Made in Maia</p><h1 className="mt-3 text-6xl font-black uppercase leading-[.85] tracking-[-.06em]">Find us everywhere.</h1><div className="mt-10 grid gap-3">{links.map(([label,url])=><a key={label} href={url} target={url.startsWith("http")?"_blank":undefined} rel="noreferrer" className="flex items-center justify-between rounded-full border-2 border-[var(--ink)] bg-white px-7 py-5 text-xl font-black uppercase transition hover:-translate-y-1 hover:bg-[var(--ink)] hover:text-white">{label}<ArrowUpRight/></a>)}</div></div></main>;
}
