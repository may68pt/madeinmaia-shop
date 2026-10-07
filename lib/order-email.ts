type OrderEmail = { reference:string; customerEmail:string; customerName:string; status:string; totalCents:number };

const labels:Record<string,string> = { pending:"recebida", paid:"paga", preparing:"em preparação", shipped:"enviada", completed:"concluída", cancelled:"cancelada", refunded:"reembolsada" };

export async function sendOrderStatusEmail(order:OrderEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL;
  if (!apiKey || !from) return { skipped:true };
  const label = labels[order.status] ?? order.status;
  const notificationEmail=process.env.ORDER_NOTIFICATION_EMAIL;
  const response = await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({from,to:[order.customerEmail],bcc:notificationEmail?[notificationEmail]:undefined,subject:`Encomenda ${order.reference}: ${label}`,html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h1 style="text-transform:uppercase">Made in Maia</h1><p>Olá ${escapeHtml(order.customerName)},</p><p>A tua encomenda <strong>${escapeHtml(order.reference)}</strong> está <strong>${escapeHtml(label)}</strong>.</p><p>Total: <strong>${(order.totalCents/100).toFixed(2).replace(".",",")} €</strong></p><p>Obrigado por escolheres uma ideia feita na Maia.</p></div>`})});
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { skipped:false };
}

function escapeHtml(value:string) { return value.replace(/[&<>'"]/g,(character)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]??character); }
