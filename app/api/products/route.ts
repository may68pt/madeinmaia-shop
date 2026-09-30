import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalogue = await getDb().select().from(products).where(eq(products.status, "published"));
    return NextResponse.json({ products: catalogue });
  } catch {
    return NextResponse.json({ products: [], storage: "unavailable" });
  }
}
