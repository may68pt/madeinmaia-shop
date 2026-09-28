import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages } from "@/db/schema";

function isAuthenticated(request: Request) {
  return Boolean(request.headers.get("oai-authenticated-user-id"));
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  try {
    const [home] = await getDb().select().from(pages).where(eq(pages.slug, "inicio"));
    return NextResponse.json({ page: home ?? null });
  } catch {
    return NextResponse.json({ page: null, storage: "unavailable" });
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const body = await request.json() as { title?: string; blocks?: unknown[]; status?: string };
  if (!body.title || !Array.isArray(body.blocks)) return NextResponse.json({ error: "Página inválida" }, { status: 400 });
  try {
    const values = { slug: "inicio", title: body.title, blocksJson: JSON.stringify(body.blocks), status: body.status === "published" ? "published" : "draft", updatedAt: Date.now() };
    await getDb().insert(pages).values(values).onConflictDoUpdate({ target: pages.slug, set: values });
    return NextResponse.json({ ok: true, savedAt: values.updatedAt });
  } catch {
    return NextResponse.json({ error: "Não foi possível guardar agora." }, { status: 503 });
  }
}
