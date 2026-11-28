import { NextResponse } from "next/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import Stripe from "stripe";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { sendOrderStatusEmail, sendShopOrderNotification } from "@/lib/order-email";
import { grantItem } from "@/lib/cyberpet/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe → shop. Register https://madeinmaia.pt/api/stripe/webhook in Stripe with:
 * checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.async_payment_failed, checkout.session.expired, charge.refunded.
 *
 * Cards and MB WAY are paid when the checkout completes. Multibanco is paid later
 * (async_payment_succeeded), so a completed-but-unpaid session leaves the order pending.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature) return NextResponse.json({ error:"Webhook não configurado" }, { status:503 });
  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch { return NextResponse.json({ error:"Assinatura inválida" }, { status:400 }); }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      // CyberPet rare item bought with euros: grant it to the pet (idempotent: one grant per pet and item)
      if (session.metadata?.kind === "cyberpet_item" && session.metadata.pet && session.metadata.item && session.payment_status === "paid") {
        await grantItem(session.metadata.pet, session.metadata.item, "paid", session.id).catch(() => undefined);
        return NextResponse.json({ received:true });
      }
      const reference = session.metadata?.reference;
      if (reference && session.payment_status === "paid") await markPaid(reference, session.id);
      else if (reference) await getDb().update(orders).set({ paymentReference:session.id }).where(eq(orders.reference, reference));
    }

    if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      const reference = event.data.object.metadata?.reference;
      if (reference) await getDb().update(orders).set({ status:"cancelled" }).where(and(eq(orders.reference, reference), eq(orders.status, "pending")));
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      // Only a full refund changes the order; partial refunds are handled by hand.
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (charge.refunded && paymentIntentId) {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const reference = intent.metadata?.reference;
        if (reference) {
          const [order] = await getDb().update(orders).set({ status:"refunded" }).where(and(eq(orders.reference, reference), ne(orders.status, "refunded"))).returning();
          if (order) await sendOrderStatusEmail(order).catch(() => undefined);
        }
      }
    }
  } catch {
    // Let Stripe retry later (database or email briefly unavailable).
    return NextResponse.json({ error:"Erro temporário" }, { status:500 });
  }
  return NextResponse.json({ received:true });
}

/** Marks an order paid once (Stripe may deliver an event more than once) and sends both emails. */
async function markPaid(reference: string, sessionId: string) {
  const [order] = await getDb()
    .update(orders)
    .set({ status:"paid", paymentReference:sessionId })
    .where(and(eq(orders.reference, reference), inArray(orders.status, ["pending", "cancelled"])))
    .returning();
  if (!order) return;
  await sendOrderStatusEmail(order).catch(() => undefined);
  await sendShopOrderNotification(order).catch(() => undefined);
}
