// The catalogue moved to /mimbo-the-good-stuff-machine — old links, phone shortcuts and stored media URLs forward there.
const NEW_BASE = "/mimbo-the-good-stuff-machine";
function forward(request: Request) {
  const url = new URL(request.url);
  const rest = url.pathname.replace(/^\/catalogo/, "");
  return Response.redirect(new URL(NEW_BASE + rest + url.search, url), 308);
}
export const GET = forward;
export const HEAD = forward;
