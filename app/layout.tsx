import type { Metadata } from "next";
import type { CSSProperties } from "react";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let theme = {
    brandColor: "#ff4f1f",
    accentColor: "#d9ff43",
    darkColor: "#171713",
    backgroundColor: "#f4f3ef",
  };
  try {
    const [settings] = await getDb()
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "global"));
    if (settings?.data.theme) theme = { ...theme, ...settings.data.theme };
  } catch {
    /* local fallback */
  }
  const themeStyle = {
    "--brand": theme.brandColor,
    "--accent-brand": theme.accentColor,
    "--ink": theme.darkColor,
    "--paper": theme.backgroundColor,
    "--primary": theme.brandColor,
    "--background": theme.backgroundColor,
    "--foreground": theme.darkColor,
  } as CSSProperties;
  return (
    <html lang="pt">
      <body style={themeStyle}>{children}</body>
    </html>
  );
}
