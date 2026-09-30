"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCartItem } from "@/lib/cart";

type Props = { slug: string; name: string; image: string; priceCents: number; colors: string[]; sizes: string[] };

export function ProductPurchase({ slug, name, image, priceCents, colors, sizes }: Props) {
  const [color, setColor] = useState(colors[0] ?? "Única");
  const [size, setSize] = useState(sizes[0] ?? "Único");
  const [added, setAdded] = useState(false);
  function add() {
    addCartItem({ slug, name, image, priceCents, color, size });
    setAdded(true); window.setTimeout(() => setAdded(false), 1800);
  }
  return <div className="mt-9 space-y-7">
    <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Cor — {color}</legend><div className="flex flex-wrap gap-2">{colors.map((value)=><button key={value} onClick={()=>setColor(value)} className={`border px-4 py-3 text-sm font-bold ${color===value?"border-[#171713] bg-[#171713] text-white":"border-black/20"}`}>{value}</button>)}</div></fieldset>
    <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Tamanho — {size}</legend><div className="flex flex-wrap gap-2">{sizes.map((value)=><button key={value} onClick={()=>setSize(value)} className={`grid size-12 place-items-center border text-sm font-black ${size===value?"border-[#ff4f1f] bg-[#ff4f1f] text-white":"border-black/20"}`}>{value}</button>)}</div></fieldset>
    <Button onClick={add} className="h-14 w-full rounded-none bg-[#171713] text-base font-black uppercase text-white">{added?<><Check/>Adicionado</>:<><ShoppingBag/>Adicionar ao saco</>}</Button>
  </div>;
}
