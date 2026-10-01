import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { pages, products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [catalogue, [page]] = await Promise.all([getDb().select().from(products).where(eq(products.status, "published")), getDb().select().from(pages).where(eq(pages.slug,"inicio"))]);
    return NextResponse.json({ products: catalogue, page: page?.status === "published" ? page : null });
  } catch {
    return NextResponse.json({ products: [], storage: "unavailable" });
  }
}
