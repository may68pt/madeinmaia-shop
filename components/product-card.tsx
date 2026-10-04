"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ImageIcon, Layers3, Shirt, ShoppingBag } from "lucide-react";
import { ProductMockup } from "@/components/product-mockup";
import type { CatalogColor, ProductSupport } from "@/lib/product-catalog";
import type { Locale } from "@/lib/i18n";
import type { ArtworkPlacements } from "@/lib/artwork-placement";

type PrintColor = "black" | "white";

export type ProductCardData = {
  slug: string;
  name: string;
  collection: string;
  tags: string[];
  price: string;
  image: string;
  colors: string[];
  monochrome: boolean;
  disabledSupports?: string[];
  artworkPlacements?:ArtworkPlacements;
};

export function ProductCard({ product, catalogColors, supports, label = "New", strings }: { product: ProductCardData; catalogColors: CatalogColor[]; supports: ProductSupport[]; label?: string; locale?:Locale; strings:Record<string,string> }) {
  const availableColors = useMemo(() => {
    const active = catalogColors.filter((color) => color.active);
    if (!product.colors.length || product.colors.includes("Unique")) return active;
    const explicit = active.filter((color) => product.colors.includes(color.name) || product.colors.includes(color.id));
    return explicit.length ? explicit : active;
  }, [catalogColors, product.colors]);
  const [colorId, setColorId] = useState(availableColors[0]?.id ?? "white");
  const [printColor, setPrintColor] = useState<PrintColor>("black");
  const availableSupports = useMemo(() => supports.filter((support) => support.active && !product.disabledSupports?.includes(support.id)), [product.disabledSupports, supports]);
  const slides = useMemo(() => [{ id:"design", name:strings.designOnly, templateImage:"" }, ...availableSupports], [availableSupports, strings.designOnly]);
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = slides[Math.min(slideIndex, slides.length - 1)] ?? slides[0];
  const color = availableColors.find((item) => item.id === colorId) ?? availableColors[0];
  const supportIcon = (id:string) => id === "design" ? <ImageIcon className="size-5"/> : id === "tote-bag" ? <ShoppingBag className="size-5"/> : id === "hoodie" ? <Layers3 className="size-5"/> : <Shirt className="size-5"/>;

  return <article className="group min-w-0 text-[var(--foreground)]">
    <div className="relative aspect-square overflow-hidden rounded-t-[1.6rem] border border-white/10 bg-[var(--surface)]">
      <Link href={`/produto/${product.slug}`} className="absolute inset-0" aria-label={`Open ${product.name}`}>
        {slide?.id === "design" ? <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#292925_0,#181816_68%)] p-[10%]"><div className="relative size-full"><Image src={product.image} alt={product.name} fill sizes="(min-width:1024px) 30vw, 90vw" unoptimized={product.image.startsWith("http")} className="object-contain drop-shadow-2xl" style={product.monochrome ? {filter:printColor === "white" ? "grayscale(1) brightness(0) invert(1)" : "grayscale(1) brightness(0)"} : undefined}/></div></div> : slide && "defaultPlacement" in slide ? <ProductMockup artwork={product.image} color={color?.name ?? "White"} name={product.name} templateImage={slide.templateImage} supportId={slide.id} printColor={product.monochrome ? printColor : "original"} placements={{[slide.id]:slide.defaultPlacement,...product.artworkPlacements}} /> : null}
      </Link>
      <span className="absolute left-4 top-4 rounded-full bg-[var(--accent-brand)] px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] text-[#111]">{label}</span>
      {product.monochrome && <div className="absolute right-4 top-4 z-10 flex gap-2" aria-label={strings.printColour}>
        {(["black","white"] as PrintColor[]).map((item)=><button key={item} type="button" onClick={()=>setPrintColor(item)} aria-label={item === "black" ? strings.blackPrint : strings.whitePrint} aria-pressed={printColor===item} className="group/print relative grid size-8 place-items-center rounded-full bg-black/35 backdrop-blur"><span className={`size-6 rounded-full border-2 transition ${item==="black"?"bg-black":"bg-white"} ${printColor===item?"scale-110 border-[var(--accent-brand)]":"border-white/45"}`}/><span role="tooltip" className="pointer-events-none absolute top-[calc(100%+.45rem)] right-0 hidden w-max rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-black shadow-xl group-hover/print:block group-focus-visible/print:block">{item === "black" ? strings.blackPrint : strings.whitePrint}</span></button>)}
      </div>}
      {slide?.id !== "design" && <div className="scrollbar-none absolute bottom-4 left-4 right-4 z-10 flex snap-x gap-2 overflow-x-auto border-0 bg-transparent p-0 shadow-none" aria-label={strings.garmentColours}>
          {availableColors.map((item) => <button key={item.id} type="button" onClick={()=>setColorId(item.id)} className="group/swatch relative shrink-0 snap-center py-1" aria-label={item.name} aria-pressed={color?.id===item.id}>
            <span className={`block size-7 rounded-full border-2 transition ${color?.id===item.id?"scale-110 border-white":"border-white/25"}`} style={{backgroundColor:item.hex}} />
            <span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 z-20 hidden w-max max-w-24 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold leading-tight text-black shadow-xl group-hover/swatch:block group-focus-visible/swatch:block">{item.name}</span>
          </button>)}
      </div>}
    </div>
    <div className="scrollbar-none flex items-center gap-2 overflow-x-auto rounded-b-[1.6rem] border-x border-b border-white/10 bg-[var(--surface)] px-3 py-3" aria-label={strings.support}>
      {slides.map((item,index)=><button key={item.id} type="button" onClick={()=>setSlideIndex(index)} aria-label={item.name} aria-pressed={slide?.id===item.id} title={item.name} className={`group/support relative grid size-10 shrink-0 place-items-center rounded-full border transition ${slide?.id===item.id?"border-[var(--accent-brand)] bg-[var(--accent-brand)] text-black":"border-white/15 bg-white/5 text-white/60 hover:border-white/40 hover:text-white"}`}>{supportIcon(item.id)}<span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 z-30 hidden w-max max-w-28 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold text-black shadow-xl group-hover/support:block group-focus-visible/support:block">{item.name}</span></button>)}
      <span className="ml-auto shrink-0 text-[10px] font-black uppercase tracking-[.1em] text-white/45">{slide?.name}</span>
    </div>
    <div className="flex items-start justify-between gap-4 pt-4">
      <div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-[.12em] text-white/42">{product.tags.join(" · ")||product.collection}</p><Link href={`/produto/${product.slug}`}><h3 className="mt-1 text-xl font-black uppercase tracking-[-.025em]">{product.name}</h3></Link></div>
      <strong className="shrink-0 text-lg">{slide && "priceCents" in slide?`${(slide.priceCents/100).toFixed(2).replace(".",",")} €`:product.price}</strong>
    </div>
  </article>;
}
