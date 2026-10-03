"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearCart, useCart } from "@/lib/cart";

type Result = { reference:string; paymentUrl:string|null; testMode:boolean };

export default function CheckoutPage() {
  const cart = useCart();
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [result,setResult] = useState<Result|null>(null);
  const subtotal = cart.reduce((sum,item)=>sum+item.priceCents*item.quantity,0);
  const shipping = subtotal >= 4500 ? 0 : 490;

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const customer = Object.fromEntries(["name","email","phone","address","postalCode","city","country"].map((key)=>[key,String(form.get(key)??"")]));
    try {
      const response = await fetch("/api/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({customer,items:cart.map(({slug,productType,color,size,quantity})=>({slug,productType:productType||"adult-tshirt",color,size,quantity}))})});
      const data = await response.json() as Result & {error?:string};
      if (!response.ok) throw new Error(data.error||"Não foi possível criar a encomenda.");
      setResult(data);
      if (data.paymentUrl) window.location.assign(data.paymentUrl);
      else clearCart();
    } catch (reason) { setError(reason instanceof Error?reason.message:"Ocorreu um erro."); } finally { setLoading(false); }
  }

  if (result) return <main className="grid min-h-screen place-items-center bg-[var(--accent-brand)] p-6 text-[var(--ink)]"><div className="max-w-xl bg-white p-8 text-center sm:p-12"><CheckCircle2 className="mx-auto size-14 text-[var(--brand)]"/><h1 className="mt-6 text-5xl font-black uppercase tracking-[-.06em]">Encomenda recebida</h1><p className="mt-5 text-lg text-black/60">Referência <strong className="text-black">{result.reference}</strong></p>{result.testMode&&<p className="mt-4 bg-[#fff0ea] p-4 text-sm">Modo de teste: a encomenda não foi guardada nem cobrada.</p>}<Button asChild className="mt-8 rounded-none bg-[var(--ink)] text-white"><Link href="/">Voltar à loja</Link></Button></div></main>;

  return <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]"><header className="flex items-center justify-between border-b border-black/10 px-5 py-5 lg:px-10"><Link href="/" className="flex items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/>Continuar compras</Link><strong className="text-xl uppercase tracking-[-.05em]">Made in Maia</strong></header><div className="mx-auto grid max-w-7xl gap-8 p-5 lg:grid-cols-[1fr_420px] lg:p-10"><form onSubmit={submit} className="bg-white p-6 sm:p-10"><p className="text-sm font-black uppercase tracking-[.16em] text-[var(--brand)]">Checkout seguro</p><h1 className="mt-3 text-5xl font-black uppercase tracking-[-.055em]">Entrega</h1><div className="mt-8 grid gap-5 sm:grid-cols-2"><Field name="name" label="Nome"/><Field name="email" label="Email" type="email"/><Field name="phone" label="Telefone"/><div className="sm:col-span-2"><Field name="address" label="Morada"/></div><Field name="postalCode" label="Código postal"/><Field name="city" label="Localidade"/><div className="sm:col-span-2"><Field name="country" label="País" defaultValue="Portugal"/></div></div>{error&&<p className="mt-5 bg-red-50 p-4 text-sm text-red-700">{error}</p>}<Button type="submit" disabled={loading||cart.length===0} className="mt-8 h-14 w-full rounded-none bg-[var(--ink)] text-base font-black uppercase text-white"><CreditCard/>{loading?"A criar encomenda…":"Continuar para pagamento"}</Button><p className="mt-4 flex items-center justify-center gap-2 text-xs text-black/50"><LockKeyhole className="size-3"/>Os dados de pagamento são tratados pelo prestador de pagamentos.</p></form><aside className="bg-[var(--ink)] p-6 text-white sm:p-8"><h2 className="text-3xl font-black uppercase tracking-[-.04em]">Resumo</h2><div className="mt-6 space-y-4">{cart.length===0?<p className="border border-white/20 p-5 text-white/60">O saco está vazio.</p>:cart.map((item)=><div key={item.key} className="flex gap-4 border-b border-white/15 pb-4"><div className="relative size-20 shrink-0 overflow-hidden bg-white"><Image src={item.image} alt="" fill sizes="80px" unoptimized={item.image.startsWith("http")} className="object-cover"/></div><div><strong className="uppercase">{item.name}</strong><p className="mt-1 text-sm text-white/55">{item.productType || "T-shirt"} · {item.size} · {item.color} · {item.quantity}×</p></div><span className="ml-auto font-bold">{((item.priceCents*item.quantity)/100).toFixed(2).replace(".",",")} €</span></div>)}</div><dl className="mt-7 space-y-3 border-t border-white/20 pt-5"><div className="flex justify-between"><dt>Subtotal</dt><dd>{(subtotal/100).toFixed(2).replace(".",",")} €</dd></div><div className="flex justify-between"><dt>Envio</dt><dd>{shipping===0?"Grátis":`${(shipping/100).toFixed(2).replace(".",",")} €`}</dd></div><div className="flex justify-between pt-4 text-2xl font-black"><dt>Total</dt><dd>{((subtotal+shipping)/100).toFixed(2).replace(".",",")} €</dd></div></dl></aside></div></main>;
}

function Field({name,label,type="text",defaultValue}:{name:string;label:string;type?:string;defaultValue?:string}) { return <label className="block"><span className="mb-2 block text-sm font-bold">{label}</span><Input name={name} type={type} defaultValue={defaultValue} required className="h-12 rounded-none"/></label>; }
