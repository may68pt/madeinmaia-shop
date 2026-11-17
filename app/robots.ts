import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://madeinmaia.pt";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/studio", "/api/", "/catalogo", "/mimbo-the-good-stuff-machine"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
