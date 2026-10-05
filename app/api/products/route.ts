import { NextResponse } from "next/server";
import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, products } from "@/db/schema";
import { LOCAL_FALLBACK_PRODUCTS } from "@/lib/fallback-products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit")) || 24));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const query = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  try {
    const filteredWhere = query
      ? and(
          eq(products.status, "published"),
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.collection, `%${query}%`),
            ilike(products.designCode, `%${query}%`),
            sql`${products.tags}::text ILIKE ${`%${query}%`}`,
          ),
        )
      : eq(products.status, "published");
    const db = getDb();
    const [catalogue, [{ total }], [page]] = await Promise.all([
      db.select().from(products).where(filteredWhere).orderBy(asc(products.sortOrder), asc(products.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(products).where(filteredWhere),
      offset === 0 ? db.select().from(pages).where(eq(pages.slug,"inicio")) : Promise.resolve([]),
    ]);
    return NextResponse.json({
      products: catalogue,
      total,
      offset,
      limit,
      hasMore: offset + catalogue.length < total,
      page: page?.status === "published" ? page : null,
    });
  } catch {
    const normalizedQuery=query.toLowerCase();
    const filtered=normalizedQuery?LOCAL_FALLBACK_PRODUCTS.filter((product)=>`${product.name} ${product.collection} ${product.tags.join(" ")}`.toLowerCase().includes(normalizedQuery)):LOCAL_FALLBACK_PRODUCTS;
    const catalogue=filtered.slice(offset,offset+limit);
    return NextResponse.json({products:catalogue,total:filtered.length,offset,limit,hasMore:offset+catalogue.length<filtered.length,page:null,storage:"local-fallback"});
  }
}
