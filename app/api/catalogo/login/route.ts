import { NextResponse } from "next/server";
import { rateLimited } from "@/lib/rate-limit";
import { checkCredentials, makeSession, sessionCookie, CATALOGO_COOKIE } from "@/lib/catalogo-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const tries = new Map<string, { n: number; t: number }>();

export async function POST(request: Request) {
  if (await rateLimited(request, "catalogo-login", 5)) return NextResponse.json({ error: "Demasiadas tentativas. Espera um minuto." }, { status: 429 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const t = tries.get(ip); const now = Date.now();
  if (t && now - t.t < 15 * 60_000 && t.n >= 8) return NextResponse.json({ error: "Demasiadas tentativas. Espera 15 minutos." }, { status: 429 });
  let user = "", pass = "";
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) { const b = (await request.json().catch(() => ({}))) as Record<string, unknown>; user = String(b.user || ""); pass = String(b.pass || ""); }
  else { const f = await request.formData().catch(() => null); user = String(f?.get("user") || ""); pass = String(f?.get("pass") || ""); }
  if (!checkCredentials(user, pass)) {
    tries.set(ip, { n: (t && now - t.t < 15 * 60_000 ? t.n : 0) + 1, t: t && now - t.t < 15 * 60_000 ? t.t : now });
    return NextResponse.json({ error: "Utilizador ou password errados." }, { status: 401 });
  }
  tries.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", sessionCookie(makeSession(user)));
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", `${CATALOGO_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
