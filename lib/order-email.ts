import { isPortugal } from "@/lib/shipping";

/**
 * Order emails, sent through Resend (https://resend.com).
 *
 * Needs RESEND_API_KEY and a sender on a domain verified in Resend
 * (ORDER_FROM_EMAIL, default "Made in Maia <loja@madeinmaia.pt>").
 * ORDER_NOTIFICATION_EMAIL receives a separate "new paid order" email with the
 * delivery details for packing. Customers get Portuguese when they ship to
 * Portugal and English otherwise.
 */

type OrderEmailItem = { name:string; productType:string; color:string; printColor?:string; size:string; quantity:number; unitPriceCents:number };
export type OrderEmail = {
  reference:string;
  customerEmail:string;
  customerName:string;
  customerPhone?:string;
  status:string;
  totalCents:number;
  shippingCents?:number;
  items?:OrderEmailItem[];
  shippingAddress?:Partial<{ address:string; postalCode:string; city:string; country:string }>;
  trackingCode?:string;
  trackingUrl?:string;
};

type Lang = "pt" | "en";
const SITE = "https://madeinmaia.pt";
const DEFAULT_FROM = "Made in Maia <loja@madeinmaia.pt>";

/** Statuses that send the customer an email (an unpaid "pending" order sends none). */
const CUSTOMER_STATUSES = new Set(["paid", "preparing", "shipped", "cancelled", "refunded"]);

const COPY: Record<Lang, Record<string, { subject:string; title:string; body:string }>> = {
  pt: {
    paid: { subject:"Encomenda confirmada", title:"Obrigado pela tua encomenda!", body:"Recebemos o teu pagamento. Cada peça é impressa à mão na Maia: vamos preparar a tua encomenda e avisamos-te quando seguir." },
    preparing: { subject:"A tua encomenda está a ser preparada", title:"Mãos à obra", body:"A tua encomenda está a ser impressa e embalada na Maia." },
    shipped: { subject:"A tua encomenda foi enviada", title:"Já vai a caminho", body:"A tua encomenda saiu da Maia e está a caminho." },
    cancelled: { subject:"Encomenda cancelada", title:"Encomenda cancelada", body:"A tua encomenda foi cancelada. Se o pagamento chegou a ser feito, será devolvido." },
    refunded: { subject:"Reembolso efetuado", title:"Reembolso efetuado", body:"Devolvemos o valor da tua encomenda. Pode demorar alguns dias a aparecer na tua conta." },
  },
  en: {
    paid: { subject:"Order confirmed", title:"Thank you for your order!", body:"We have received your payment. Every piece is printed by hand in Maia, Portugal: we will prepare your order and let you know when it ships." },
    preparing: { subject:"Your order is being prepared", title:"Work in progress", body:"Your order is being printed and packed in Maia." },
    shipped: { subject:"Your order has shipped", title:"It's on its way", body:"Your order has left Maia and is on its way to you." },
    cancelled: { subject:"Order cancelled", title:"Order cancelled", body:"Your order has been cancelled. If a payment was taken, it will be refunded." },
    refunded: { subject:"Refund issued", title:"Refund issued", body:"We have refunded your order. It can take a few days to show on your statement." },
  },
};

const WORDS: Record<Lang, Record<string,string>> = {
  pt: { hello:"Olá", order:"Encomenda", qty:"Qtd.", shipping:"Envio", free:"Grátis", total:"Total", deliverTo:"Entrega", tracking:"Seguir envio", trackingCode:"Código de envio", questions:"Alguma dúvida? Responde a este email.", printColor:"impressão", black:"preta", white:"branca" },
  en: { hello:"Hi", order:"Order", qty:"Qty", shipping:"Shipping", free:"Free", total:"Total", deliverTo:"Delivery", tracking:"Track your parcel", trackingCode:"Tracking code", questions:"Any questions? Just reply to this email.", printColor:"print", black:"black", white:"white" },
};

export function emailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.ORDER_FROM_EMAIL || DEFAULT_FROM,
    notify: process.env.ORDER_NOTIFICATION_EMAIL ?? "",
    replyTo: process.env.ORDER_REPLY_TO_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || "",
  };
}

async function send(message: { to:string[]; subject:string; html:string; text:string; replyTo?:string }) {
  const { apiKey, from } = emailConfig();
  if (!apiKey) return { skipped:true as const };
  const response = await fetch("https://api.resend.com/emails", {
    method:"POST",
    headers:{ authorization:`Bearer ${apiKey}`, "content-type":"application/json" },
    body:JSON.stringify({ from, to:message.to, subject:message.subject, html:message.html, text:message.text, ...(message.replyTo ? { reply_to:message.replyTo } : {}) }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}: ${(await response.text().catch(() => "")).slice(0, 200)}`);
  return { skipped:false as const };
}

function langFor(order: OrderEmail): Lang {
  return isPortugal(order.shippingAddress?.country ?? "Portugal") ? "pt" : "en";
}

/** Email to the customer for a status change. Does nothing for statuses that don't notify. */
export async function sendOrderStatusEmail(order: OrderEmail) {
  if (!CUSTOMER_STATUSES.has(order.status)) return { skipped:true as const };
  const lang = langFor(order);
  const copy = COPY[lang][order.status];
  const w = WORDS[lang];
  const subject = `${copy.subject} · ${order.reference}`;
  const tracking = order.status === "shipped" && (order.trackingCode || order.trackingUrl)
    ? { code:order.trackingCode ?? "", url:order.trackingUrl ?? "" }
    : null;
  const html = layout(`
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#ff4f1f;font-weight:800">${escapeHtml(w.order)} ${escapeHtml(order.reference)}</p>
    <h1 style="margin:0 0 16px;font-size:30px;line-height:1;text-transform:uppercase">${escapeHtml(copy.title)}</h1>
    <p style="margin:0 0 8px">${escapeHtml(w.hello)} ${escapeHtml(firstName(order.customerName))},</p>
    <p style="margin:0 0 20px;line-height:1.5">${escapeHtml(copy.body)}</p>
    ${tracking ? `<p style="margin:0 0 20px;padding:14px;background:#f4f3ef">${tracking.code ? `${escapeHtml(w.trackingCode)}: <strong>${escapeHtml(tracking.code)}</strong><br>` : ""}${tracking.url ? `<a href="${escapeHtml(tracking.url)}" style="color:#ff4f1f;font-weight:800">${escapeHtml(w.tracking)} →</a>` : ""}</p>` : ""}
    ${["paid", "preparing", "shipped"].includes(order.status) ? itemsTable(order, lang) + addressBlock(order, lang) : ""}
    <p style="margin:24px 0 0;color:#666;font-size:13px">${escapeHtml(w.questions)}</p>`);
  const text = [
    `${w.order} ${order.reference}`, copy.title, "", `${w.hello} ${firstName(order.customerName)},`, copy.body, "",
    ...(tracking ? [`${w.trackingCode}: ${tracking.code}`, tracking.url, ""] : []),
    ...(order.items ?? []).map((item) => `${item.quantity}× ${item.name} · ${item.productType} · ${item.size} · ${item.color} — ${money(item.unitPriceCents * item.quantity)}`),
    ...(order.items?.length ? [`${w.shipping}: ${order.shippingCents ? money(order.shippingCents) : w.free}`, `${w.total}: ${money(order.totalCents)}`, ""] : []),
    w.questions, SITE,
  ].join("\n");
  return send({ to:[order.customerEmail], subject, html, text, replyTo:emailConfig().replyTo || undefined });
}

/** Email to the shop for a newly paid order, with everything needed to print and ship it. */
export async function sendShopOrderNotification(order: OrderEmail) {
  const { notify } = emailConfig();
  if (!notify) return { skipped:true as const };
  const a = order.shippingAddress ?? {};
  const subject = `🧾 Nova encomenda paga ${order.reference} · ${money(order.totalCents)}`;
  const html = layout(`
    <h1 style="margin:0 0 12px;font-size:26px;text-transform:uppercase">Nova encomenda paga</h1>
    <p style="margin:0 0 16px"><strong>${escapeHtml(order.reference)}</strong> · ${money(order.totalCents)}</p>
    ${itemsTable(order, "pt")}
    <p style="margin:16px 0 4px;font-weight:800;text-transform:uppercase;font-size:13px">Cliente</p>
    <p style="margin:0;line-height:1.5">${escapeHtml(order.customerName)}<br>${escapeHtml(order.customerEmail)}${order.customerPhone ? `<br>${escapeHtml(order.customerPhone)}` : ""}</p>
    <p style="margin:16px 0 4px;font-weight:800;text-transform:uppercase;font-size:13px">Morada de entrega</p>
    <p style="margin:0;line-height:1.5">${escapeHtml(a.address ?? "")}<br>${escapeHtml(a.postalCode ?? "")} ${escapeHtml(a.city ?? "")}<br>${escapeHtml(a.country ?? "")}</p>
    <p style="margin:20px 0 0"><a href="${SITE}/studio" style="color:#ff4f1f;font-weight:800">Abrir no Studio →</a></p>`);
  const text = [
    `Nova encomenda paga ${order.reference} · ${money(order.totalCents)}`, "",
    ...(order.items ?? []).map((item) => `${item.quantity}× ${item.name} · ${item.productType} · ${item.size} · ${item.color}${item.printColor ? ` · impressão ${item.printColor}` : ""}`),
    "", order.customerName, order.customerEmail, order.customerPhone ?? "", "",
    a.address ?? "", `${a.postalCode ?? ""} ${a.city ?? ""}`, a.country ?? "", "", `${SITE}/studio`,
  ].join("\n");
  return send({ to:notify.split(",").map((value) => value.trim()).filter(Boolean), subject, html, text, replyTo:order.customerEmail });
}

/** Studio "send test email" button. */
export async function sendTestEmail(to: string) {
  return send({
    to:[to],
    subject:"Teste de email · Made in Maia",
    html:layout(`<h1 style="margin:0 0 12px;font-size:26px;text-transform:uppercase">Os emails estão a funcionar</h1><p style="margin:0">Este é um teste enviado pelo Studio da loja. As encomendas vão chegar assim.</p>`),
    text:"Os emails estão a funcionar. Este é um teste enviado pelo Studio da loja.",
  });
}

function itemsTable(order: OrderEmail, lang: Lang) {
  const w = WORDS[lang];
  const rows = (order.items ?? []).map((item) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #e6e4dc"><strong>${escapeHtml(item.name)}</strong><br><span style="color:#666;font-size:13px">${escapeHtml(item.productType)} · ${escapeHtml(item.size)} · ${escapeHtml(item.color)}${item.printColor ? ` · ${escapeHtml(w.printColor)} ${escapeHtml(item.printColor === "white" ? w.white : item.printColor === "black" ? w.black : item.printColor)}` : ""}</span></td>
      <td style="padding:10px 8px;border-bottom:1px solid #e6e4dc;text-align:center;white-space:nowrap">${item.quantity}×</td>
      <td style="padding:10px 0;border-bottom:1px solid #e6e4dc;text-align:right;white-space:nowrap">${money(item.unitPriceCents * item.quantity)}</td>
    </tr>`).join("");
  if (!rows) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:15px">${rows}
    <tr><td style="padding:10px 0" colspan="2">${escapeHtml(w.shipping)}</td><td style="padding:10px 0;text-align:right">${order.shippingCents ? money(order.shippingCents) : escapeHtml(w.free)}</td></tr>
    <tr><td style="padding:4px 0;font-weight:800;font-size:18px" colspan="2">${escapeHtml(w.total)}</td><td style="padding:4px 0;text-align:right;font-weight:800;font-size:18px">${money(order.totalCents)}</td></tr>
  </table>`;
}

function addressBlock(order: OrderEmail, lang: Lang) {
  const a = order.shippingAddress;
  if (!a?.address) return "";
  return `<p style="margin:20px 0 4px;font-weight:800;text-transform:uppercase;font-size:13px">${escapeHtml(WORDS[lang].deliverTo)}</p>
    <p style="margin:0;line-height:1.5;color:#333">${escapeHtml(order.customerName)}<br>${escapeHtml(a.address)}<br>${escapeHtml(a.postalCode ?? "")} ${escapeHtml(a.city ?? "")}<br>${escapeHtml(a.country ?? "")}</p>`;
}

function layout(content: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f3ef;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:28px 24px">
    <p style="margin:0 0 24px;font-size:18px;font-weight:900;letter-spacing:.06em;text-transform:uppercase">Made in Maia</p>
    ${content}
  </div>
  <p style="max-width:560px;margin:14px auto 0;text-align:center;color:#888;font-size:12px">Made in Maia · Maia, Portugal · <a href="${SITE}" style="color:#888">madeinmaia.pt</a></p>
</body></html>`;
}

function firstName(name: string) { return name.trim().split(/\s+/)[0] || name; }
function escapeHtml(value:string) { return String(value ?? "").replace(/[&<>'"]/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]??character); }
function money(value:number) { return `${(value/100).toFixed(2).replace(".",",")} €`; }
