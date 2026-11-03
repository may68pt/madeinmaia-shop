import { NextResponse } from "next/server";

/* Same manifest as /petz/manifest.webmanifest, but the start URL carries a link code,
   so the home-screen app opens already linked to the pet it was installed from. */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const link = (new URL(request.url).searchParams.get("link") ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
  return NextResponse.json({
    name: "Petz",
    short_name: "Petz",
    id: "/petz",
    start_url: link ? `/petz?link=${link}` : "/petz",
    scope: "/petz",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0a1f",
    theme_color: "#0c0a1f",
    icons: [
      { src: "/petz/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/petz/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } });
}
