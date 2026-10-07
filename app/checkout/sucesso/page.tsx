"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearCart } from "@/lib/cart";

type OrderSummary = { reference:string; status:string; items:Array<{name:string;productType:string;color:string;printColor:string;size:string;quantity:number;unitPriceCents:number}>; shippingCents:number; totalCents:number; trackingCode:string; trackingUrl:string };
const statusLabels:Record<string,string>={pending:"Recebida",paid:"Paga",preparing:"Em preparação",shipped:"Enviada",completed:"Concluída",cancelled:"Cancelada",refunded:"Reembolsada"};
const money=(value:number)=>`${(value/100).toFixed(2).replace(".",",")} €`;

export default function PaymentSuccessPage() {
  const [sessionId]=useState(()=>typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("session_id") ?? "");
  const [order,setOrder]=useState<OrderSummary|null>(null);
  const [loading,setLoading]=useState(Boolean(sessionId));
  useEffect(()=>{
    clearCart();
    if(!sessionId)return;
    fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`).then((response)=>response.ok?response.json() as Promise<{order:OrderSummary}>:Promise.reject()).then((payload)=>setOrder(payload.order)).catch(()=>undefined).finally(()=>setLoading(false));
  },[sessionId]);
  return <main className="min-h-screen bg-[var(--accent-brand)] p-4 text-[var(--ink)] sm:p-8"><div className="mx-auto max-w-2xl bg-white p-6 sm:p-10"><CheckCircle2 className="size-14 text-[var(--brand)]"/><p className="mt-6 text-sm font-black uppercase tracking-[.16em]">Pagamento recebido</p><h1 className="mt-2 text-4xl font-black uppercase tracking-[-.06em] sm:text-6xl">Obrigado!</h1>{loading?<div className="mt-8 flex items-center gap-3 text-black/55"><LoaderCircle className="size-5 animate-spin"/>A carregar a encomenda…</div>:order?<><div className="mt-8 border-y border-black/10 py-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase text-black/45">Encomenda</p><p className="font-mono text-lg font-black">{order.reference}</p></div><span className="rounded-full bg-black px-4 py-2 text-xs font-black uppercase text-white">{statusLabels[order.status]??order.status}</span></div><ul className="mt-6 space-y-3">{order.items.map((item,index)=><li key={`${item.name}-${index}`} className="flex justify-between gap-4 text-sm"><span>{item.quantity}× <strong>{item.name}</strong><span className="block text-black/50">{item.productType} · {item.size} · {item.color}</span></span><strong>{money(item.unitPriceCents*item.quantity)}</strong></li>)}</ul><div className="mt-5 space-y-1 border-t border-black/10 pt-4 text-sm"><p className="flex justify-between"><span>Envio</span><strong>{order.shippingCents?money(order.shippingCents):"Grátis"}</strong></p><p className="flex justify-between text-lg"><span>Total</span><strong>{money(order.totalCents)}</strong></p></div></div>{(order.trackingCode||order.trackingUrl)&&<div className="mt-5 flex items-center gap-3 bg-black/5 p-4"><PackageCheck className="size-6"/><div><p className="text-xs font-black uppercase">Tracking</p>{order.trackingUrl?<a className="font-bold underline" href={order.trackingUrl} target="_blank" rel="noreferrer">{order.trackingCode||"Acompanhar envio"}</a>:<p className="font-mono font-bold">{order.trackingCode}</p>}</div></div>}</>:<p className="mt-5 text-lg leading-relaxed text-black/60">A tua encomenda foi registada. Receberás os detalhes e atualizações no email indicado no checkout.</p>}<Button asChild className="mt-8 rounded-none bg-[var(--ink)] text-white"><Link href="/loja">Voltar à loja</Link></Button></div></main>;
}
