import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Made in Maia — T-shirts com ideias";
  let description =
    "T-shirts desenhadas e impressas na Maia. Designs originais, cores à escolha e uma surpresa em cada símbolo.";
  try {
    const [settings] = await getDb()
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "global"));
    if (settings) {
      title = settings.data.seoTitle || title;
      description = settings.data.seoDescription || description;
    }
  } catch {
    /* local fallback */
  }
  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", locale: "pt_PT" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
