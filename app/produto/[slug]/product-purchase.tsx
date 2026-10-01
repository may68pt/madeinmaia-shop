"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductMockup } from "@/components/product-mockup";
import { addCartItem } from "@/lib/cart";
import { ADULT_SIZES, KIDS_SIZES, normalizeSupport, supportOptions, type CatalogColor, type ProductSupport } from "@/lib/product-catalog";

type Props = { slug:string; name:string; description:string; collection:string; image:string; gallery:string[]; priceCents:number; supports:ProductSupport[]; catalogColors:CatalogColor[] };

export function ProductPurchase({ slug, name, description, collection, image, gallery, priceCents, supports, catalogColors }: Props) {
  const normalizedSupports = supports.map(normalizeSupport);
  const [supportId, setSupportId] = useState(normalizedSupports[0]?.id ?? "tshirt-150");
  const support = normalizedSupports.find((item) => item.id === supportId) ?? normalizedSupports[0];
  const supportColors = catalogColors.filter((color) => color.active && support?.colorIds.includes(color.id));
  const [colorId, setColorId] = useState(supportColors[0]?.id ?? "white");
  const color = supportColors.find((item) => item.id === colorId) ?? supportColors[0];
  const options = support && color ? supportOptions(support, color.id) : [];
  const [size, setSize] = useState(options[0] ?? "Único");
  const [added, setAdded] = useState(false);

  function chooseSupport(id:string) {
    const next = normalizedSupports.find((item) => item.id === id);
    const nextColor = catalogColors.find((item) => item.active && next?.colorIds.includes(item.id));
    const nextOptions = next && nextColor ? supportOptions(next, nextColor.id) : [];
    setSupportId(id); setColorId(nextColor?.id ?? "white"); setSize(nextOptions[0] ?? "Único");
  }
  function chooseColor(id:string) {
    setColorId(id);
    const nextOptions = support ? supportOptions(support, id) : [];
    setSize(nextOptions.includes(size) ? size : nextOptions[0] ?? "Único");
  }
  function add() {
    if (!support || !color) return;
    addCartItem({ slug, name, image, priceCents, productType:support.id, color:color.name, size });
    setAdded(true); window.setTimeout(() => setAdded(false), 1800);
  }

  if (!support) return <section className="mx-auto max-w-3xl p-12 text-center"><h1 className="text-4xl font-black uppercase">Produto temporariamente indisponível</h1></section>;
  return <>
    <section className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]">
      <div className="relative min-h-[55vh] bg-white lg:min-h-[calc(100vh-73px)]"><ProductMockup artwork={image} color={color?.name ?? "White"} name={name} templateImage={support.templateImage} baseImage={support.mockups[color?.id ?? ""]} priority /><div className="absolute bottom-5 left-5 bg-white/90 px-3 py-2 text-xs font-bold uppercase backdrop-blur">{support.name} · {color?.name}</div></div>
      <div className="flex items-center p-7 sm:p-12 lg:p-16"><div className="w-full max-w-xl"><p className="text-sm font-black uppercase tracking-[.16em] text-[var(--brand)]">{collection}</p><h1 className="mt-4 text-5xl font-black uppercase leading-[.9] tracking-[-.06em] sm:text-7xl">{name}</h1><p className="mt-6 text-2xl font-black">{(priceCents/100).toFixed(2).replace(".",",")} €</p><p className="mt-6 text-lg leading-relaxed text-black/60">{description || "Desenhada e impressa na Maia em pequenas séries."}</p><div className="mt-9 space-y-7">
        <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Suporte — {support.name}</legend><div className="grid gap-2">{normalizedSupports.map((item)=><button key={item.id} onClick={()=>chooseSupport(item.id)} className={`rounded-full border px-5 py-3 text-left text-sm font-bold ${support.id===item.id?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-black/20"}`}>{item.name}</button>)}</div></fieldset>
        <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Cor — {color?.name}</legend><div className="flex flex-wrap gap-3">{supportColors.map((item)=><button key={item.id} onClick={()=>chooseColor(item.id)} title={item.name} className={`grid size-11 place-items-center rounded-full border-2 ${color?.id===item.id?"scale-110 border-[var(--ink)]":"border-black/15"}`}><span className="size-8 rounded-full border border-black/10" style={{backgroundColor:item.hex}} /></button>)}</div></fieldset>
        {support.variantMode !== "none" && <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Tamanho — {size}</legend><div className="grid gap-4 sm:grid-cols-2">{[{label:"Kids",values:KIDS_SIZES},{label:"Adults",values:ADULT_SIZES}].map((group)=>{const values=group.values.filter((item)=>options.includes(item));return values.length?<div key={group.label} className="rounded-2xl border border-black/10 p-4"><p className="mb-3 text-xs font-black uppercase">{group.label}</p><div className="flex flex-wrap gap-2">{values.map((item)=><button key={item} onClick={()=>setSize(item)} className={`grid min-w-12 place-items-center rounded-full border px-4 py-3 text-sm font-black ${size===item?"border-[var(--brand)] bg-[var(--brand)] text-white":"border-black/20"}`}>{item}</button>)}</div></div>:null})}</div></fieldset>}
        <Button onClick={add} disabled={!color} className="h-14 w-full rounded-none bg-[var(--ink)] text-base font-black uppercase text-white">{added?<><Check/>Adicionado</>:<><ShoppingBag/>Adicionar ao saco</>}</Button>
      </div><p className="mt-6 flex items-center gap-2 text-sm text-black/55"><Truck className="size-4"/>Envio gratuito em Portugal a partir de 45 €</p></div></div>
    </section>
    {gallery.length>0&&<section className="mx-auto max-w-[1440px] px-5 py-12 lg:px-10"><h2 className="mb-6 text-3xl font-black uppercase">Em contexto</h2><div className="grid gap-4 sm:grid-cols-2">{gallery.map((photo,index)=><div key={photo} className="relative aspect-[4/5] bg-white"><Image src={photo} alt={`${name} fotografia ${index+1}`} fill sizes="50vw" unoptimized={photo.startsWith("http")} className="object-cover"/></div>)}</div></section>}
  </>;
}
