import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, pages, products, randomContent } from "@/db/schema";
import { sendOrderStatusEmail } from "@/lib/order-email";

function isAuthenticated(request: Request) {
  const expected = process.env.STUDIO_PASSWORD;
  return Boolean(expected && request.headers.get("x-studio-key") === expected);
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  try {
    const db = getDb();
    const [[home], productList, discoveries, orderList] = await Promise.all([
      db.select().from(pages).where(eq(pages.slug, "inicio")),
      db.select().from(products),
      db.select().from(randomContent),
      db.select().from(orders).orderBy(desc(orders.createdAt)),
    ]);
    return NextResponse.json({ page: home ?? null, products: productList, randomContent: discoveries, orders: orderList, paymentConfigured: Boolean(process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_LINK_URL) });
  } catch {
    return NextResponse.json({ page: null, products: [], randomContent: [], orders: [], paymentConfigured: Boolean(process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_LINK_URL), storage: "unavailable" });
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const body = await request.json() as { resource?: string; reference?: string; title?: string; blocks?: unknown[]; status?: string; entries?: unknown[] };
  if (body.resource === "order-status") {
    const allowed = ["pending", "paid", "preparing", "shipped", "cancelled"];
    if (!body.reference || !body.status || !allowed.includes(body.status)) return NextResponse.json({ error:"Estado inválido" }, { status:400 });
    try {
      const db = getDb();
      const updated = await db.update(orders).set({ status:body.status }).where(eq(orders.reference, body.reference)).returning({ reference:orders.reference, status:orders.status });
      if (!updated.length) return NextResponse.json({ error:"Encomenda não encontrada" }, { status:404 });
      const [order] = await db.select().from(orders).where(eq(orders.reference,body.reference));
      if (order) await sendOrderStatusEmail(order).catch(()=>undefined);
      return NextResponse.json({ ok:true, order:updated[0] });
    } catch { return NextResponse.json({ error:"Não foi possível atualizar a encomenda." }, { status:503 }); }
  }
  if (body.resource === "products") {
    if (!Array.isArray(body.entries)) return NextResponse.json({ error: "Catálogo inválido" }, { status: 400 });
    const entries = body.entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const value = entry as Record<string, unknown>;
      const name = String(value.name ?? "").trim();
      const slug = String(value.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
      if (!name || !slug) return [];
      return [{
        slug, name, description: String(value.description ?? ""), priceCents: Math.max(0, Number(value.priceCents) || 0),
        collection: String(value.collection ?? "Made in Maia"), imageKey: value.imageKey ? String(value.imageKey) : null,
        colors: Array.isArray(value.colors) ? value.colors.map(String) : [], sizes: Array.isArray(value.sizes) ? value.sizes.map(String) : [],
        variants: Array.isArray(value.variants) ? value.variants.flatMap((variant)=>{ if(!variant||typeof variant!=="object")return[]; const item=variant as Record<string,unknown>; return [{ sku:String(item.sku??""), color:String(item.color??""), size:String(item.size??""), stock:Math.max(0,Number(item.stock)||0) }]; }) : [],
        status: value.status === "published" ? "published" : "draft", updatedAt: new Date(),
      }];
    });
    const db = getDb();
    for (const entry of entries) await db.insert(products).values(entry).onConflictDoUpdate({ target: products.slug, set: entry });
    return NextResponse.json({ ok: true, count: entries.length });
  }
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
