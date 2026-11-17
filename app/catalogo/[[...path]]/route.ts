// The catalogue moved to /mimbo-the-good-stuff-machine — old links, phone shortcuts and stored media URLs forward there.
const NEW_BASE = "/mimbo-the-good-stuff-machine";
function forward(request: Request) {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/catalogo/, "");
  // relative Location: stays on the public host (behind the proxy request.url is the internal address)
  return new Response(null, { status: 308, headers: { location: NEW_BASE + (rest || "/") + url.search, "cache-control": "no-store" } });
}
export const GET = forward;
export const HEAD = forward;
