import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  orders,
  pages,
  products,
  randomContent,
  siteSettings,
} from "@/db/schema";
import { sendOrderStatusEmail } from "@/lib/order-email";
import { DEFAULT_COLORS, DEFAULT_SUPPORTS } from "@/lib/product-catalog";

function isAuthenticated(request: Request) {
  const expected = process.env.STUDIO_PASSWORD;
  return Boolean(expected && request.headers.get("x-studio-key") === expected);
}

export async function GET(request: Request) {
  if (!isAuthenticated(request))
    return NextResponse.json(
      { error: "Autenticação necessária" },
      { status: 401 },
    );
  try {
    const db = getDb();
    const [[home], productList, discoveries, orderList, [settings]] =
      await Promise.all([
        db.select().from(pages).where(eq(pages.slug, "inicio")),
        db.select().from(products),
        db.select().from(randomContent),
        db.select().from(orders).orderBy(desc(orders.createdAt)),
        db.select().from(siteSettings).where(eq(siteSettings.key, "global")),
      ]);
    return NextResponse.json({
      page: home ?? null,
      products: productList,
      randomContent: discoveries,
      orders: orderList,
      settings: settings?.data ?? null,
      paymentConfigured: Boolean(
        process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_LINK_URL,
      ),
    });
  } catch {
    return NextResponse.json({
      page: null,
      products: [],
      randomContent: [],
      orders: [],
      settings: null,
      paymentConfigured: Boolean(
        process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_LINK_URL,
      ),
      storage: "unavailable",
    });
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request))
    return NextResponse.json(
      { error: "Autenticação necessária" },
      { status: 401 },
    );
  const body = (await request.json()) as {
    resource?: string;
    reference?: string;
    title?: string;
    blocks?: unknown[];
    status?: string;
    entries?: unknown[];
  };
  if (body.resource === "settings") {
    if (!body.entries?.[0] || typeof body.entries[0] !== "object")
      return NextResponse.json(
        { error: "Definições inválidas" },
        { status: 400 },
      );
    const value = body.entries[0] as Record<string, unknown>;
    const data = {
      brandName: String(value.brandName ?? "Made in Maia"),
      contactEmail: String(value.contactEmail ?? ""),
      announcement: String(value.announcement ?? ""),
      seoTitle: String(value.seoTitle ?? ""),
      seoDescription: String(value.seoDescription ?? ""),
      instagramUrl: String(value.instagramUrl ?? ""),
      facebookUrl: String(value.facebookUrl ?? ""),
      terms: String(value.terms ?? ""),
      privacy: String(value.privacy ?? ""),
      returns: String(value.returns ?? ""),
      theme: {
        brandColor: String(
          (value.theme as Record<string, unknown> | undefined)?.brandColor ??
            "#ff4f1f",
        ),
        accentColor: String(
          (value.theme as Record<string, unknown> | undefined)?.accentColor ??
            "#d9ff43",
        ),
        darkColor: String(
          (value.theme as Record<string, unknown> | undefined)?.darkColor ??
            "#171713",
        ),
        backgroundColor: String(
          (value.theme as Record<string, unknown> | undefined)
            ?.backgroundColor ?? "#f4f3ef",
        ),
      },
      productCatalog: {
        colors: Array.isArray((value.productCatalog as Record<string, unknown> | undefined)?.colors)
          ? ((value.productCatalog as Record<string, unknown>).colors as unknown[]).flatMap((entry) => {
              if (!entry || typeof entry !== "object") return [];
              const color = entry as Record<string, unknown>;
              return [{ id: String(color.id ?? ""), name: String(color.name ?? ""), hex: String(color.hex ?? "#ffffff"), active: color.active !== false }];
            })
          : DEFAULT_COLORS,
        supports: Array.isArray((value.productCatalog as Record<string, unknown> | undefined)?.supports)
          ? ((value.productCatalog as Record<string, unknown>).supports as unknown[]).flatMap((entry) => {
              if (!entry || typeof entry !== "object") return [];
              const support = entry as Record<string, unknown>;
              return [{ id: String(support.id ?? ""), name: String(support.name ?? ""), sizes: Array.isArray(support.sizes) ? support.sizes.map(String) : [], colorIds: Array.isArray(support.colorIds) ? support.colorIds.map(String) : [], active: support.active !== false, mockups: support.mockups && typeof support.mockups === "object" ? Object.fromEntries(Object.entries(support.mockups as Record<string, unknown>).map(([key, url]) => [key, String(url)])) : {} }];
            })
          : DEFAULT_SUPPORTS,
      },
      media: Array.isArray(value.media)
        ? value.media.flatMap((item) =>
            item && typeof item === "object"
              ? [
                  {
                    url: String((item as Record<string, unknown>).url ?? ""),
                    alt: String((item as Record<string, unknown>).alt ?? ""),
                  },
                ]
              : [],
          )
        : [],
    };
    await getDb()
      .insert(siteSettings)
      .values({ key: "global", data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { data, updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true });
  }
  if (body.resource === "order-status") {
    const allowed = ["pending", "paid", "preparing", "shipped", "cancelled"];
    if (!body.reference || !body.status || !allowed.includes(body.status))
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    try {
      const db = getDb();
      const updated = await db
        .update(orders)
        .set({ status: body.status })
        .where(eq(orders.reference, body.reference))
        .returning({ reference: orders.reference, status: orders.status });
      if (!updated.length)
        return NextResponse.json(
          { error: "Encomenda não encontrada" },
          { status: 404 },
        );
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.reference, body.reference));
      if (order) await sendOrderStatusEmail(order).catch(() => undefined);
      return NextResponse.json({ ok: true, order: updated[0] });
    } catch {
      return NextResponse.json(
        { error: "Não foi possível atualizar a encomenda." },
        { status: 503 },
      );
    }
  }
  if (body.resource === "products") {
    if (!Array.isArray(body.entries))
      return NextResponse.json({ error: "Catálogo inválido" }, { status: 400 });
    const entries = body.entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const value = entry as Record<string, unknown>;
      const name = String(value.name ?? "").trim();
      const slug = String(value.slug ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "");
      if (!name || !slug) return [];
      return [
        {
          slug,
          name,
          description: String(value.description ?? ""),
          priceCents: Math.max(0, Number(value.priceCents) || 0),
          collection: String(value.collection ?? "Made in Maia"),
          imageKey: value.imageKey ? String(value.imageKey) : null,
          gallery: Array.isArray(value.gallery) ? value.gallery.map(String).filter(Boolean) : [],
          disabledSupports: Array.isArray(value.disabledSupports) ? value.disabledSupports.map(String) : [],
          colors: Array.isArray(value.colors) ? value.colors.map(String) : [],
          sizes: Array.isArray(value.sizes) ? value.sizes.map(String) : [],
          variants: Array.isArray(value.variants)
            ? value.variants.flatMap((variant) => {
                if (!variant || typeof variant !== "object") return [];
                const item = variant as Record<string, unknown>;
                return [
                  {
                    sku: String(item.sku ?? ""),
                    type: String(item.type ?? "adult-tshirt"),
                    color: String(item.color ?? ""),
                    size: String(item.size ?? ""),
                    stock: Math.max(0, Number(item.stock) || 0),
                    active: item.active !== false,
                  },
                ];
              })
            : [],
          status: value.status === "published" ? "published" : "draft",
          updatedAt: new Date(),
        },
      ];
    });
    const db = getDb();
    for (const entry of entries)
      await db
        .insert(products)
        .values(entry)
        .onConflictDoUpdate({ target: products.slug, set: entry });
    return NextResponse.json({ ok: true, count: entries.length });
  }
  if (body.resource === "random-content") {
    if (!Array.isArray(body.entries))
      return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
    const entries = body.entries.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const value = entry as Record<string, unknown>;
      if (!String(value.title ?? "").trim()) return [];
      return [
        {
          title: String(value.title),
          type: String(value.type ?? "text"),
          body: String(value.body ?? ""),
          mediaUrl: value.mediaUrl ? String(value.mediaUrl) : null,
          linkUrl: value.linkUrl ? String(value.linkUrl) : null,
          linkLabel: String(value.linkLabel ?? "Descobrir"),
          weight: Math.max(1, Number(value.weight) || 1),
          active: value.active !== false,
          updatedAt: new Date(),
        },
      ];
    });
    const db = getDb();
    await db.delete(randomContent);
    if (entries.length) await db.insert(randomContent).values(entries);
    return NextResponse.json({ ok: true, count: entries.length });
  }
  if (!body.title || !Array.isArray(body.blocks))
    return NextResponse.json({ error: "Página inválida" }, { status: 400 });
  try {
    const values = {
      slug: "inicio",
      title: body.title,
      blocks: body.blocks,
      status: body.status === "published" ? "published" : "draft",
      updatedAt: new Date(),
    };
    await getDb()
      .insert(pages)
      .values(values)
      .onConflictDoUpdate({ target: pages.slug, set: values });
    return NextResponse.json({
      ok: true,
      savedAt: values.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível guardar agora." },
      { status: 503 },
    );
  }
}
