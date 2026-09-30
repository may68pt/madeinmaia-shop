import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { getDb } from "@/db";
import { orders } from "@/db/schema";

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
    if (reference) await getDb().update(orders).set({ status:"paid", paymentReference:session.id }).where(eq(orders.reference,reference));
  }
  if (event.type === "checkout.session.expired") {
    const reference = event.data.object.metadata?.reference;
    if (reference) await getDb().update(orders).set({ status:"cancelled" }).where(eq(orders.reference,reference));
  }
  return NextResponse.json({ received:true });
}
