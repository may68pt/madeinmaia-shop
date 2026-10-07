type OrderEmailItem = { name:string; productType:string; color:string; printColor?:string; size:string; quantity:number; unitPriceCents:number };
type OrderEmail = { reference:string; customerEmail:string; customerName:string; status:string; totalCents:number; shippingCents?:number; items?:OrderEmailItem[]; trackingCode?:string; trackingUrl?:string };

const labels:Record<string,string> = { pending:"recebida", paid:"paga", preparing:"em preparação", shipped:"enviada", completed:"concluída", cancelled:"cancelada", refunded:"reembolsada" };

export async function sendOrderStatusEmail(order:OrderEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL;
  if (!apiKey || !from) return { skipped:true };
  const label = labels[order.status] ?? order.status;
  const notificationEmail=process.env.ORDER_NOTIFICATION_EMAIL;
  const itemList = order.items?.length ? `<ul style="padding-left:20px">${order.items.map((item)=>`<li>${item.quantity}× ${escapeHtml(item.name)} · ${escapeHtml(item.productType)} · ${escapeHtml(item.size)} · ${escapeHtml(item.color)}${item.printColor ? ` · impressão ${escapeHtml(item.printColor)}` : ""}</li>`).join("")}</ul>` : "";
  const tracking = order.trackingCode || order.trackingUrl ? `<p><strong>Tracking:</strong> ${escapeHtml(order.trackingCode || "Consultar envio")}${order.trackingUrl ? ` · <a href="${escapeHtml(order.trackingUrl)}">acompanhar encomenda</a>` : ""}</p>` : "";
  const response = await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({from,to:[order.customerEmail],bcc:notificationEmail?[notificationEmail]:undefined,subject:`Encomenda ${order.reference}: ${label}`,html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="text-transform:uppercase">Made in Maia</h1><p>Olá ${escapeHtml(order.customerName)},</p><p>A tua encomenda <strong>${escapeHtml(order.reference)}</strong> está <strong>${escapeHtml(label)}</strong>.</p>${itemList}${order.shippingCents !== undefined ? `<p>Envio: <strong>${formatCurrency(order.shippingCents)}</strong></p>` : ""}<p>Total: <strong>${formatCurrency(order.totalCents)}</strong></p>${tracking}<p>Obrigado por escolheres uma ideia feita na Maia.</p></div>`})});
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { skipped:false };
}

function escapeHtml(value:string) { return value.replace(/[&<>'"]/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]??character); }
function formatCurrency(value:number) { return `${(value/100).toFixed(2).replace(".",",")} €`; }
