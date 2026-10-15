import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, lt, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { analyticsEvents, orders } from "@/db/schema";

export const dynamic="force-dynamic";

const eventNames=["page_view","product_view","product_click","product_configure","add_to_cart","remove_from_cart","cart_open","begin_checkout","checkout_submit","checkout_redirect","linklabel_view","linklabel_action","linklabel_next","collection_view","search"] as const;
const eventSchema=z.object({eventName:z.enum(eventNames),visitorId:z.string().uuid(),sessionId:z.string().uuid(),path:z.string().max(500),entityType:z.enum(["product","linklabel","collection","page"]).optional(),entityId:z.string().max(160).optional(),referrer:z.string().max(1000).optional(),device:z.enum(["mobile","tablet","desktop"]),metadata:z.record(z.string(),z.union([z.string().max(240),z.number(),z.boolean()])).default({})});
const requestCounters=new Map<string,{started:number;count:number}>();

function validOrigin(request:Request){const origin=request.headers.get("origin");if(!origin)return true;try{return new URL(origin).host===(request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()||request.headers.get("host")||new URL(request.url).host);}catch{return false;}}
function authenticated(request:Request){return Boolean(process.env.STUDIO_PASSWORD&&request.headers.get("x-studio-user")===(process.env.STUDIO_USERNAME||"madeinmaia")&&request.headers.get("x-studio-key")===process.env.STUDIO_PASSWORD);}

export async function POST(request:Request){
  if(!validOrigin(request))return NextResponse.json({error:"Invalid origin"},{status:403});
  if(Number(request.headers.get("content-length")||0)>12_000)return NextResponse.json({error:"Event too large"},{status:413});
  const parsed=eventSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid event"},{status:400});
  const event=parsed.data;
  if(Object.keys(event.metadata).length>20)return NextResponse.json({error:"Too much metadata"},{status:400});
  const now=Date.now();const counter=requestCounters.get(event.visitorId);if(!counter||now-counter.started>60_000)requestCounters.set(event.visitorId,{started:now,count:1});else{counter.count+=1;if(counter.count>120)return NextResponse.json({error:"Rate limited"},{status:429});}if(requestCounters.size>10_000)requestCounters.clear();
  let referrerHost:string|null=null;
  if(event.referrer)try{const host=new URL(event.referrer).hostname;referrerHost=host===new URL(request.url).hostname?"direct/internal":host.slice(0,160);}catch{referrerHost=null;}
  try{await getDb().insert(analyticsEvents).values({...event,referrerHost});return new NextResponse(null,{status:204});}catch{return NextResponse.json({error:"Analytics unavailable"},{status:503});}
}

export async function GET(request:Request){
  if(!authenticated(request))return NextResponse.json({error:"Autenticação necessária"},{status:401});
  const url=new URL(request.url);const days=Math.min(365,Math.max(7,Number(url.searchParams.get("days"))||30));
  const end=new Date();const start=new Date(end.getTime()-days*86400000);const previousStart=new Date(start.getTime()-days*86400000);const db=getDb();
  try{
    const [totals,previous,[audience],[previousAudience],daily,topProducts,topLinkLabels,devices,referrers,[sales],[previousSales]]=await Promise.all([
      db.select({eventName:analyticsEvents.eventName,value:count()}).from(analyticsEvents).where(gte(analyticsEvents.createdAt,start)).groupBy(analyticsEvents.eventName),
      db.select({eventName:analyticsEvents.eventName,value:count()}).from(analyticsEvents).where(and(gte(analyticsEvents.createdAt,previousStart),lt(analyticsEvents.createdAt,start))).groupBy(analyticsEvents.eventName),
      db.select({visitors:sql<number>`count(distinct ${analyticsEvents.visitorId})`,sessions:sql<number>`count(distinct ${analyticsEvents.sessionId})`}).from(analyticsEvents).where(gte(analyticsEvents.createdAt,start)),
      db.select({visitors:sql<number>`count(distinct ${analyticsEvents.visitorId})`,sessions:sql<number>`count(distinct ${analyticsEvents.sessionId})`}).from(analyticsEvents).where(and(gte(analyticsEvents.createdAt,previousStart),lt(analyticsEvents.createdAt,start))),
      db.select({day:sql<string>`to_char(date_trunc('day', ${analyticsEvents.createdAt}), 'YYYY-MM-DD')`,views:sql<number>`count(*) filter (where ${analyticsEvents.eventName} in ('page_view','product_view','collection_view','linklabel_view'))`,addToCart:sql<number>`count(*) filter (where ${analyticsEvents.eventName} = 'add_to_cart')`}).from(analyticsEvents).where(gte(analyticsEvents.createdAt,start)).groupBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`).orderBy(sql`date_trunc('day', ${analyticsEvents.createdAt})`),
      db.select({id:analyticsEvents.entityId,views:sql<number>`count(*) filter (where ${analyticsEvents.eventName} = 'product_view')`,cartAdds:sql<number>`count(*) filter (where ${analyticsEvents.eventName} = 'add_to_cart')`}).from(analyticsEvents).where(and(gte(analyticsEvents.createdAt,start),eq(analyticsEvents.entityType,"product"))).groupBy(analyticsEvents.entityId).orderBy(desc(sql`count(*) filter (where ${analyticsEvents.eventName} = 'product_view')`)).limit(12),
      db.select({id:analyticsEvents.entityId,views:count()}).from(analyticsEvents).where(and(gte(analyticsEvents.createdAt,start),eq(analyticsEvents.eventName,"linklabel_view"))).groupBy(analyticsEvents.entityId).orderBy(desc(count())).limit(12),
      db.select({name:analyticsEvents.device,value:count()}).from(analyticsEvents).where(gte(analyticsEvents.createdAt,start)).groupBy(analyticsEvents.device).orderBy(desc(count())),
      db.select({name:analyticsEvents.referrerHost,value:count()}).from(analyticsEvents).where(gte(analyticsEvents.createdAt,start)).groupBy(analyticsEvents.referrerHost).orderBy(desc(count())).limit(8),
      db.select({orders:count(),revenue:sum(orders.totalCents)}).from(orders).where(and(gte(orders.createdAt,start),sql`${orders.status} in ('paid','preparing','shipped','completed')`)),
      db.select({orders:count(),revenue:sum(orders.totalCents)}).from(orders).where(and(gte(orders.createdAt,previousStart),lt(orders.createdAt,start),sql`${orders.status} in ('paid','preparing','shipped','completed')`)),
    ]);
    return NextResponse.json({days,totals:Object.fromEntries(totals.map((item)=>[item.eventName,Number(item.value)])),previous:Object.fromEntries(previous.map((item)=>[item.eventName,Number(item.value)])),audience:{visitors:Number(audience?.visitors??0),sessions:Number(audience?.sessions??0)},previousAudience:{visitors:Number(previousAudience?.visitors??0),sessions:Number(previousAudience?.sessions??0)},daily:daily.map((item)=>({...item,views:Number(item.views),addToCart:Number(item.addToCart)})),topProducts:topProducts.map((item)=>({...item,views:Number(item.views),cartAdds:Number(item.cartAdds)})),topLinkLabels:topLinkLabels.map((item)=>({...item,views:Number(item.views)})),devices:devices.map((item)=>({...item,value:Number(item.value)})),referrers:referrers.map((item)=>({name:item.name||"Direct / unknown",value:Number(item.value)})),sales:{orders:Number(sales?.orders??0),revenue:Number(sales?.revenue??0)},previousSales:{orders:Number(previousSales?.orders??0),revenue:Number(previousSales?.revenue??0)}});
  }catch{return NextResponse.json({error:"Analytics unavailable"},{status:503});}
}
