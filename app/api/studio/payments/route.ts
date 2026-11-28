import { NextResponse } from "next/server";
import Stripe from "stripe";
import { emailConfig, sendTestEmail } from "@/lib/order-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_EVENTS = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired", "charge.refunded"];

function isAuthenticated(request: Request) {
  const expectedPassword = process.env.STUDIO_PASSWORD;
  const expectedUser = process.env.STUDIO_USERNAME || "madeinmaia";
  return Boolean(expectedPassword && request.headers.get("x-studio-user") === expectedUser && request.headers.get("x-studio-key") === expectedPassword);
}

type Check = { ok: boolean; label: string; detail: string };

/** Setup checklist for payments and order emails, shown in Studio → Encomendas. */
export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const checks: Check[] = [];
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const mode = key.startsWith("sk_live_") || key.startsWith("rk_live_") ? "live" : key ? "test" : "off";

  checks.push({ ok: Boolean(key), label: "Chave Stripe (STRIPE_SECRET_KEY)", detail: key ? (mode === "live" ? "Modo real: os clientes pagam a sério." : "Modo de teste: usa o cartão 4242 4242 4242 4242.") : "Em falta: o checkout responde “pagamento indisponível”." });
  if (key) {
    const stripe = new Stripe(key);
    try {
      const account = await stripe.accounts.retrieveCurrent();
      checks.push({ ok: account.charges_enabled === true, label: "Conta Stripe pronta a cobrar", detail: account.charges_enabled ? `${account.settings?.dashboard?.display_name || account.business_profile?.name || account.id} · ${account.country ?? ""}` : "O Stripe ainda não ativou pagamentos: completa a verificação da conta." });
    } catch (error) {
      checks.push({ ok: false, label: "Conta Stripe pronta a cobrar", detail: `Não foi possível ler a conta: ${error instanceof Error ? error.message.slice(0, 120) : "erro"}` });
    }
    try {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
      const endpoint = endpoints.data.find((item) => item.url.includes("/api/stripe/webhook") && item.status === "enabled");
      const missing = endpoint ? WEBHOOK_EVENTS.filter((name) => !endpoint.enabled_events.includes(name) && !endpoint.enabled_events.includes("*")) : WEBHOOK_EVENTS;
      checks.push({ ok: Boolean(endpoint) && missing.length === 0, label: "Webhook no Stripe", detail: !endpoint ? "Cria um endpoint para https://madeinmaia.pt/api/stripe/webhook." : missing.length ? `Faltam eventos: ${missing.join(", ")}` : endpoint.url });
    } catch {
      checks.push({ ok: false, label: "Webhook no Stripe", detail: "Não foi possível listar os webhooks (a chave pode ser restrita)." });
    }
  }
  checks.push({ ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET), label: "Segredo do webhook (STRIPE_WEBHOOK_SECRET)", detail: process.env.STRIPE_WEBHOOK_SECRET ? "Definido." : "Em falta: sem ele as encomendas não passam a “paga”." });

  const email = emailConfig();
  checks.push({ ok: Boolean(email.apiKey), label: "Chave Resend (RESEND_API_KEY)", detail: email.apiKey ? "Definida." : "Em falta: não são enviados emails." });
  const domain = email.from.match(/@([^>\s]+)/)?.[1] ?? "";
  if (email.apiKey && domain) {
    try {
      const response = await fetch("https://api.resend.com/domains", { headers: { authorization: `Bearer ${email.apiKey}` }, cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { data?: { name: string; status: string }[] };
        const found = data.data?.find((item) => item.name === domain);
        checks.push({ ok: found?.status === "verified", label: `Domínio ${domain} verificado no Resend`, detail: found ? `Estado: ${found.status}` : "Adiciona o domínio no Resend e os registos DNS no Cloudflare." });
      } else checks.push({ ok: true, label: `Domínio ${domain} no Resend`, detail: "A chave só envia (não lê domínios): usa “Enviar email de teste” para confirmar." });
    } catch {
      checks.push({ ok: false, label: `Domínio ${domain} no Resend`, detail: "Não foi possível contactar o Resend." });
    }
  }
  checks.push({ ok: true, label: "Remetente (ORDER_FROM_EMAIL)", detail: email.from });
  checks.push({ ok: Boolean(email.notify), label: "Aviso de novas encomendas (ORDER_NOTIFICATION_EMAIL)", detail: email.notify || "Em falta: não recebes o email com a morada para enviar." });

  return NextResponse.json({ mode, ready: checks.every((check) => check.ok), checks, notify: email.notify });
}

/** { action: "test-email", to? } sends a test email (to the notification address by default). */
export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { action?: string; to?: string } | null;
  if (body?.action !== "test-email") return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  const to = (body.to || emailConfig().notify.split(",")[0] || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return NextResponse.json({ error: "Indica um email válido." }, { status: 400 });
  try {
    const result = await sendTestEmail(to);
    return result.skipped ? NextResponse.json({ error: "RESEND_API_KEY em falta." }, { status: 503 }) : NextResponse.json({ ok: true, to });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falhou o envio." }, { status: 502 });
  }
}
