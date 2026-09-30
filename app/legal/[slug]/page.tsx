import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";

export const dynamic = "force-dynamic";
const defaults: Record<string, { title: string; body: string }> = {
  terms: { title: "Termos e condições", body: "Conteúdo em preparação." },
  privacy: {
    title: "Política de privacidade",
    body: "Conteúdo em preparação.",
  },
  returns: { title: "Trocas e devoluções", body: "Conteúdo em preparação." },
};

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fallback = defaults[slug] ?? defaults.terms;
  let body = fallback.body;
  try {
    const [settings] = await getDb()
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "global"));
    const value = settings?.data[slug as "terms" | "privacy" | "returns"];
    if (typeof value === "string" && value.trim()) body = value;
  } catch {
    /* fallback */
  }
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-[#171713]">
      <header className="border-b border-black/10 px-5 py-5 lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-black uppercase"
        >
          <ArrowLeft className="size-4" />
          Loja
        </Link>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-black uppercase tracking-[.16em] text-[#ff4f1f]">
          Made in Maia
        </p>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-[-.055em] sm:text-7xl">
          {fallback.title}
        </h1>
        <div className="mt-10 whitespace-pre-wrap text-lg leading-relaxed text-black/70">
          {body}
        </div>
      </article>
    </main>
  );
}
