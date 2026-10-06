"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, ThumbsDown } from "lucide-react";

type SwipeProduct={slug:string;name:string;imageKey:string|null};

export function DesignSwipe({products}:{products:SwipeProduct[]}){
  const [index,setIndex]=useState(0);
  const [busy,setBusy]=useState(false);
  const product=products[index%products.length];
  async function vote(value:-1|1){if(!product||busy)return;let visitorId=localStorage.getItem("mim-feedback-id");if(!visitorId){visitorId=crypto.randomUUID();localStorage.setItem("mim-feedback-id",visitorId);}setBusy(true);try{await fetch("/api/design-feedback",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({productSlug:product.slug,visitorId,vote:value})});}finally{setIndex((current)=>current+1);setBusy(false);}}
  if(!product)return <p className="p-10 text-center">No designs available.</p>;
  return <div className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-xl flex-col justify-center px-4 py-8">
    <div className="relative aspect-square overflow-hidden border border-white/15 bg-[#eee9df]"><Image key={product.slug} src={product.imageKey||"/products/white-shirt-1.jpg"} alt={product.name} fill priority={index===0} sizes="(max-width:640px) 92vw, 576px" unoptimized className="object-contain p-[9%]"/></div>
    <div className="flex items-center justify-between gap-4 border-x border-b border-white/15 bg-[var(--surface)] p-4"><h1 className="text-xl font-black uppercase">{product.name}</h1><Link href={`/produto/${product.slug}`} className="grid size-11 shrink-0 place-items-center bg-white text-black" aria-label={`Buy ${product.name}`}><ShoppingBag/></Link></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><button disabled={busy} onClick={()=>void vote(-1)} className="flex h-16 items-center justify-center gap-2 border border-white/20 bg-white/5 font-black uppercase hover:bg-white/10"><ThumbsDown/>Skip</button><button disabled={busy} onClick={()=>void vote(1)} className="flex h-16 items-center justify-center gap-2 bg-[var(--brand)] font-black uppercase text-white hover:brightness-110"><Heart/>Love it</button></div>
    <p className="mt-4 text-center text-xs text-white/45">Anonymous design feedback. No personal profile required.</p>
  </div>;
}
