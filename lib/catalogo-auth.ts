// MiM Catálogo 16 · login for the web/mobile/desktop app (same credentials as the Studio)
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";

export const CATALOGO_COOKIE = "mimcat";
const MAX_AGE = 60 * 24 * 3600; // 60 days

function secret() { return process.env.CATALOGO_SECRET || process.env.STUDIO_PASSWORD || ""; }
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
function same(a: string, b: string) { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }

export function checkCredentials(user: string, pass: string) {
  const u = process.env.STUDIO_USERNAME || "madeinmaia", p = process.env.STUDIO_PASSWORD || "";
  return Boolean(p) && same(user || "", u) && same(pass || "", p);
}
export function makeSession(user: string) {
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readSession(token?: string | null) {
  if (!token || !secret()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !same(sig, sign(payload))) return null;
  try { const d = JSON.parse(Buffer.from(payload, "base64url").toString()); return d.exp > Date.now() ? d : null; } catch { return null; }
}
export function sessionFromRequest(request: Request) {
  const raw = request.headers.get("cookie") || "";
  const m = raw.split(";").map((c) => c.trim()).find((c) => c.startsWith(CATALOGO_COOKIE + "="));
  return readSession(m ? decodeURIComponent(m.slice(CATALOGO_COOKIE.length + 1)) : null);
}
export function studioHeaders(request: Request) {
  return Boolean(process.env.STUDIO_PASSWORD && request.headers.get("x-studio-user") === (process.env.STUDIO_USERNAME || "madeinmaia") && request.headers.get("x-studio-key") === process.env.STUDIO_PASSWORD);
}
export function authorized(request: Request) { return Boolean(sessionFromRequest(request)) || studioHeaders(request); }
export function sessionCookie(token: string) {
  return `${CATALOGO_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}
export function catalogoDir(...parts: string[]) {
  const base = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads"), "catalogo");
  return path.join(base, ...parts);
}
