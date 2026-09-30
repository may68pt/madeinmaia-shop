import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, products, randomContent } from "@/db/schema";

function isAuthenticated(request: Request) {
  const expected = process.env.STUDIO_PASSWORD;
  return Boolean(expected && request.headers.get("x-studio-key") === expected);
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  try {
    const db = getDb();
    const [[home], productList, discoveries] = await Promise.all([
      db.select().from(pages).where(eq(pages.slug, "inicio")),
      db.select().from(products),
      db.select().from(randomContent),
    ]);
    return NextResponse.json({ page: home ?? null, products: productList, randomContent: discoveries });
  } catch {
    return NextResponse.json({ page: null, products: [], randomContent: [], storage: "unavailable" });
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const body = await request.json() as { resource?: string; title?: string; blocks?: unknown[]; status?: string; entries?: unknown[] };
  if (body.resource === "random-content") {
    if (!Array.isArray(body.entries)) return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
    const entries = body.entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const value = entry as Record<string, unknown>;
      if (!String(value.title ?? "").trim()) return [];
      return [{
        title: String(value.title), type: String(value.type ?? "text"), body: String(value.body ?? ""),
        mediaUrl: value.mediaUrl ? String(value.mediaUrl) : null, linkUrl: value.linkUrl ? String(value.linkUrl) : null,
        linkLabel: String(value.linkLabel ?? "Descobrir"), weight: Math.max(1, Number(value.weight) || 1),
        active: value.active !== false, updatedAt: new Date(),
      }];
    });
    const db = getDb();
    await db.delete(randomContent);
    if (entries.length) await db.insert(randomContent).values(entries);
    return NextResponse.json({ ok: true, count: entries.length });
  }
  if (!body.title || !Array.isArray(body.blocks)) return NextResponse.json({ error: "Página inválida" }, { status: 400 });
  try {
    const values = { slug: "inicio", title: body.title, blocks: body.blocks, status: body.status === "published" ? "published" : "draft", updatedAt: new Date() };
    await getDb().insert(pages).values(values).onConflictDoUpdate({ target: pages.slug, set: values });
    return NextResponse.json({ ok: true, savedAt: values.updatedAt.toISOString() });
  } catch {
    return NextResponse.json({ error: "Não foi possível guardar agora." }, { status: 503 });
  }
}
