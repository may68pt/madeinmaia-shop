export function GET() {
  return new Response(null, {
    status: 307,
    headers: {
      Location: "https://madeinmaia-charm-selector.may68.chatgpt.site/",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
