"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, ShoppingBag, Truck } from "lucide-react";
import { SupportIcon } from "@/components/support-icon";
import { Button } from "@/components/ui/button";
import { ProductMockup } from "@/components/product-mockup";
import { addCartItem } from "@/lib/cart";
import { ADULT_SIZES, KIDS_SIZES, normalizeSupport, supportOptions, type CatalogColor, type ProductSupport } from "@/lib/product-catalog";
import type { ArtworkPlacements } from "@/lib/artwork-placement";

type Props = { slug:string; name:string; description:string; collection:string; image:string; gallery:string[]; priceCents:number; supports:ProductSupport[]; catalogColors:CatalogColor[]; monochrome:boolean; artworkPlacements:ArtworkPlacements };

export function ProductPurchase({ slug, name, description, collection, image, gallery, supports, catalogColors, monochrome, artworkPlacements }: Props) {
  const activeColors = catalogColors.filter((color) => color.active);
  const normalizedSupports = supports.map(normalizeSupport).filter((item) =>
    activeColors.some((color) => item.colorIds.includes(color.id) && (item.variantMode === "none" || supportOptions(item, color.id).length > 0)),
  );
  const [supportId, setSupportId] = useState(normalizedSupports[0]?.id ?? "tshirt-150");
  const support = normalizedSupports.find((item) => item.id === supportId) ?? normalizedSupports[0];
  const supportColors = activeColors.filter((color) => support?.colorIds.includes(color.id) && (support.variantMode === "none" || supportOptions(support, color.id).length > 0));
  const [colorId, setColorId] = useState(supportColors[0]?.id ?? "white");
  const color = supportColors.find((item) => item.id === colorId) ?? supportColors[0];
  const options = support && color ? supportOptions(support, color.id) : [];
  const [size, setSize] = useState(options[0] ?? "Único");
  const [printColor, setPrintColor] = useState<"black" | "white">("black");
  const [added, setAdded] = useState(false);

  function chooseSupport(id:string) {
    const next = normalizedSupports.find((item) => item.id === id);
    const nextColor = activeColors.find((item) => next?.colorIds.includes(item.id) && (next.variantMode === "none" || supportOptions(next, item.id).length > 0));
    const nextOptions = next && nextColor ? supportOptions(next, nextColor.id) : [];
    setSupportId(id); setColorId(nextColor?.id ?? "white"); setSize(nextOptions[0] ?? "Único");
  }
  function chooseColor(id:string) {
    setColorId(id);
    const nextOptions = support ? supportOptions(support, id) : [];
    setSize(nextOptions.includes(size) ? size : nextOptions[0] ?? "Único");
  }
  function add() {
    if (!support || !color || (support.variantMode !== "none" && !options.includes(size))) return;
    addCartItem({ slug, name, image, priceCents:support.priceCents, productType:support.id, color:color.name, printColor, size });
    setAdded(true); window.setTimeout(() => setAdded(false), 1800);
  }
  function supportIcon(id: string) {
    return <span className="grid size-8 place-items-center rounded-full bg-white"><SupportIcon supportId={id} size={22} /></span>;
  }

  if (!support) return <section id="mim-product-unavailable" className="mim-product-unavailable mx-auto max-w-3xl p-12 text-center"><h1 className="text-4xl font-black uppercase">Produto temporariamente indisponível</h1></section>;
  return <>
    <section id="mim-product-configurator" className="mim-product-configurator mx-auto grid max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]">
      <div className="mim-product-configurator__preview relative min-h-[55vh] overflow-hidden bg-[var(--surface)] lg:min-h-[calc(100vh-73px)]"><ProductMockup artwork={image} color={color?.name ?? "White"} name={name} supportId={support.id} templateImage={support.templateImage} baseImage={support.mockups[color?.id ?? ""]} printColor={monochrome ? printColor : "original"} placements={{[support.id]:support.defaultPlacement,...artworkPlacements}} priority /><div className="mim-product-configurator__preview-label absolute bottom-5 left-5 rounded-full border border-white/10 bg-black/75 px-4 py-2 text-xs font-bold uppercase text-white backdrop-blur">{support.name} · {color?.name}{monochrome ? ` · ${printColor} print` : ""}</div></div>
      <div className="mim-product-configurator__controls flex items-center p-7 sm:p-12 lg:p-16"><div className="w-full max-w-xl"><p className="mim-product-configurator__collection text-sm font-black uppercase tracking-[.16em] text-[var(--brand)]">{collection}</p><h1 className="mim-product-configurator__title mt-4 text-5xl font-black uppercase leading-[.9] tracking-[-.06em] sm:text-7xl">{name}</h1><p className="mim-product-configurator__price mt-6 text-2xl font-black">{(support.priceCents/100).toFixed(2).replace(".",",")} €</p><p className="mim-product-configurator__description mt-6 text-lg leading-relaxed text-white/60">{description || "Desenhada e impressa na Maia em pequenas séries."}</p><div className="mim-product-configurator__options mt-9 space-y-7">
        <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Suporte — {support.name}</legend><div className="flex flex-wrap gap-2">{normalizedSupports.map((item)=><button key={item.id} onClick={()=>chooseSupport(item.id)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-bold transition ${support.id===item.id?"border-white bg-white text-black":"border-white/20 bg-white/5 text-white hover:border-white/45"}`}>{supportIcon(item.id)}<span>{item.name}</span></button>)}</div></fieldset>
        <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Cor — {color?.name}</legend><div className="scrollbar-none flex snap-x gap-3 overflow-x-auto py-2">{supportColors.map((item)=><button key={item.id} onClick={()=>chooseColor(item.id)} title={item.name} className={`group/swatch relative grid size-11 shrink-0 snap-center place-items-center rounded-full border-2 ${color?.id===item.id?"scale-110 border-white":"border-white/15"}`}><span className="size-8 rounded-full border border-black/15" style={{backgroundColor:item.hex}} /><span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.4rem)] left-1/2 z-20 hidden w-max max-w-28 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold leading-tight text-black shadow-xl group-hover/swatch:block group-focus-visible/swatch:block">{item.name}</span></button>)}</div></fieldset>
        {monochrome && <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Cor da impressão — {printColor}</legend><div className="inline-flex rounded-full border border-white/15 bg-white/5 p-1">{(["black","white"] as const).map((item)=><button key={item} type="button" onClick={()=>setPrintColor(item)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold capitalize ${printColor===item?"bg-white text-black":"text-white/60"}`}><span className={`size-4 rounded-full border ${item==="black"?"border-white/25 bg-black":"border-black/20 bg-white"}`}/>{item}</button>)}</div></fieldset>}
        {support.variantMode !== "none" && <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Tamanho — {size}</legend><div className="grid gap-4 sm:grid-cols-2">{[{label:"Kids",values:KIDS_SIZES},{label:"Adults",values:ADULT_SIZES}].map((group)=>{const values=group.values.filter((item)=>options.includes(item));return values.length?<div key={group.label} className="rounded-2xl border border-black/10 p-4"><p className="mb-3 text-xs font-black uppercase">{group.label}</p><div className="flex flex-wrap gap-2">{values.map((item)=><button key={item} onClick={()=>setSize(item)} className={`grid min-w-12 place-items-center rounded-full border px-4 py-3 text-sm font-black ${size===item?"border-[var(--brand)] bg-[var(--brand)] text-white":"border-black/20"}`}>{item}</button>)}</div></div>:null})}</div></fieldset>}
        <Button onClick={add} disabled={!color || (support.variantMode !== "none" && !options.includes(size))} className="h-14 w-full rounded-none bg-white text-base font-black uppercase text-black hover:bg-white/85">{added?<><Check/>Adicionado</>:<><ShoppingBag/>Adicionar ao saco</>}</Button>
      </div><p className="mt-6 flex items-center gap-2 text-sm text-white/55"><Truck className="size-4"/>Envio gratuito em Portugal a partir de 45 €</p></div></div>
    </section>
    {gallery.length>0&&<section id="mim-product-gallery" className="mim-product-gallery mx-auto max-w-[1440px] px-5 py-12 lg:px-10"><h2 className="mb-6 text-3xl font-black uppercase">Em contexto</h2><div className="grid gap-4 sm:grid-cols-2">{gallery.map((photo,index)=><div key={photo} className="mim-product-gallery__item relative aspect-[4/5] bg-white"><Image src={photo} alt={`${name} fotografia ${index+1}`} fill sizes="50vw" unoptimized={photo.startsWith("http")} className="object-cover"/></div>)}</div></section>}
  </>;
}
