import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Made in Maia — T-shirts com ideias",
  description: "T-shirts desenhadas e impressas na Maia. Designs originais, cores à escolha e edições com QR personalizado.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt"><body>{children}</body></html>;
}
