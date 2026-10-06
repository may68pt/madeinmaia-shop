import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { designFeedback, products } from "@/db/schema";

export async function POST(request:Request) {
  const body = await request.json().catch(()=>null) as { productSlug?:unknown; visitorId?:unknown; vote?:unknown } | null;
  const productSlug = String(body?.productSlug ?? "").trim().slice(0,160);
  const visitorId = String(body?.visitorId ?? "").trim();
  const vote = Number(body?.vote);
  if (!productSlug || !/^[a-f0-9-]{36}$/i.test(visitorId) || ![-1,1].includes(vote)) return NextResponse.json({error:"Invalid feedback"},{status:400});
  const db=getDb();
  const [product]=await db.select({slug:products.slug}).from(products).where(and(eq(products.slug,productSlug),eq(products.status,"published"),eq(products.onlineSaleEnabled,true))).limit(1);
  if(!product)return NextResponse.json({error:"Product not found"},{status:404});
  await db.insert(designFeedback).values({productSlug,visitorId,vote}).onConflictDoUpdate({target:[designFeedback.visitorId,designFeedback.productSlug],set:{vote,updatedAt:new Date()}});
  const [summary]=await db.select({likes:sql<number>`count(*) filter (where ${designFeedback.vote} = 1)`,dislikes:sql<number>`count(*) filter (where ${designFeedback.vote} = -1)`}).from(designFeedback).where(eq(designFeedback.productSlug,productSlug));
  return NextResponse.json({ok:true,summary});
}
