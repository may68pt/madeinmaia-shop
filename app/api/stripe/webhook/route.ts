import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { products } from "@/db/schema";
import { sendOrderStatusEmail } from "@/lib/order-email";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature) return NextResponse.json({ error:"Webhook não configurado" }, { status:503 });
  let event: Stripe.Event;
  try {
    const stripe = new Stripe(secret);
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch { return NextResponse.json({ error:"Assinatura inválida" }, { status:400 }); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const reference = session.metadata?.reference;
    if (reference) {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.reference,reference));
      if (order && order.status !== "paid") {
        for (const item of order.items) {
          const [product] = await db.select().from(products).where(eq(products.slug,item.slug));
          if (product?.variants.length) await db.update(products).set({ variants:product.variants.map((variant)=>(variant.type||"adult-tshirt")===item.productType&&variant.color===item.color&&variant.size===item.size?{...variant,stock:Math.max(0,variant.stock-item.quantity)}:variant), updatedAt:new Date() }).where(eq(products.slug,item.slug));
        }
        await db.update(orders).set({ status:"paid", paymentReference:session.id }).where(eq(orders.reference,reference));
        await sendOrderStatusEmail({ ...order, status:"paid" }).catch(()=>undefined);
      }
    }
  }
  if (event.type === "checkout.session.expired") {
    const reference = event.data.object.metadata?.reference;
    if (reference) await getDb().update(orders).set({ status:"cancelled" }).where(eq(orders.reference,reference));
  }
  return NextResponse.json({ received:true });
}
