import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { orders, products } from "@/db/schema";

const schema = z.object({
  customer: z.object({ name:z.string().trim().min(2), email:z.string().email(), phone:z.string().trim().min(6), address:z.string().trim().min(4), postalCode:z.string().trim().min(4), city:z.string().trim().min(2), country:z.string().trim().min(2) }),
  items: z.array(z.object({ slug:z.string().min(1), color:z.string().min(1), size:z.string().min(1), quantity:z.number().int().min(1).max(20) })).min(1),
});

const fallback = new Map([
  ["guardiao-zen", { name:"Guardião Zen", priceCents:2000, colors:["Branco"], sizes:["XS","S","M","L","XL","XXL"] }],
  ["piramide-digital", { name:"Pirâmide Digital", priceCents:2000, colors:["Vermelho"], sizes:["XS","S","M","L","XL","XXL"] }],
  ["los-robots", { name:"Los Robots", priceCents:2000, colors:["Azul"], sizes:["XS","S","M","L","XL","XXL"] }],
]);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error:"Confirma os dados de entrega e o carrinho." }, { status:400 });
  const { customer, items } = parsed.data;
  const slugs = [...new Set(items.map((item)=>item.slug))];
  const catalogue = new Map<string,{name:string;priceCents:number;colors:string[];sizes:string[]}>(fallback);
  if (process.env.DATABASE_URL) {
    try {
      const stored = await getDb().select().from(products).where(inArray(products.slug, slugs));
      for (const product of stored) if (product.status === "published") catalogue.set(product.slug, { name:product.name, priceCents:product.priceCents, colors:product.colors, sizes:product.sizes });
    } catch { return NextResponse.json({ error:"Não foi possível validar o catálogo." }, { status:503 }); }
  }
  const orderItems = items.flatMap((item)=>{
    const product = catalogue.get(item.slug);
    if (!product || !product.colors.includes(item.color) || !product.sizes.includes(item.size)) return [];
    return [{ ...item, name:product.name, unitPriceCents:product.priceCents }];
  });
  if (orderItems.length !== items.length) return NextResponse.json({ error:"Um produto ou variante deixou de estar disponível." }, { status:409 });
  const subtotalCents = orderItems.reduce((sum,item)=>sum+item.unitPriceCents*item.quantity,0);
  const shippingCents = subtotalCents >= 4500 ? 0 : 490;
  const totalCents = subtotalCents + shippingCents;
  const reference = `MIM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
  if (process.env.DATABASE_URL) {
    try {
      await getDb().insert(orders).values({ reference, customerEmail:customer.email, customerName:customer.name, customerPhone:customer.phone, shippingAddress:{ address:customer.address, postalCode:customer.postalCode, city:customer.city, country:customer.country }, items:orderItems, shippingCents, totalCents, status:"pending", paymentProvider:process.env.PAYMENT_LINK_URL?"payment-link":"manual" });
    } catch { return NextResponse.json({ error:"Não foi possível criar a encomenda." }, { status:503 }); }
  }
  let paymentUrl: string | null = null;
  if (process.env.PAYMENT_LINK_URL) {
    const url = new URL(process.env.PAYMENT_LINK_URL);
    url.searchParams.set("reference", reference); url.searchParams.set("amount", String(totalCents));
    paymentUrl = url.toString();
  }
  return NextResponse.json({ ok:true, reference, subtotalCents, shippingCents, totalCents, paymentUrl, testMode:!process.env.DATABASE_URL });
}
