"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { ProductMockup } from "@/components/product-mockup";
import { SupportIcon } from "@/components/support-icon";
import type { CatalogColor, ProductSupport } from "@/lib/product-catalog";
import type { Locale } from "@/lib/i18n";
import type { ArtworkPlacements } from "@/lib/artwork-placement";
import { trackEvent } from "@/lib/analytics";
import { cardBadges, type ProductBadges } from "@/lib/product-badges";

type PrintColor = "black" | "white";

function stableColourOffset(value: string, length: number) {
  return length ? [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7) % length : 0;
}

/** Card price: whole euros without cents ("15 €"), otherwise "15,50 €". */
function cardPrice(cents:number){return cents%100===0?`${cents/100} €`:`${(cents/100).toFixed(2).replace(".",",")} €`;}

export type ProductCardData = {
  slug: string;
  name: string;
  collection: string;
  tags: string[];
  price: string;
  image: string;
  colors: string[];
  previewColorIds?: string[];
  monochrome: boolean;
  disabledSupports?: string[];
  artworkPlacements?:ArtworkPlacements;
  imageAlt?: string;
  imageTitle?: string;
  publishedAt?: string | Date | null;
  badges?: ProductBadges | null;
};

export function ProductCard({ product, catalogColors, supports, label = "New", strings }: { product: ProductCardData; catalogColors: CatalogColor[]; supports: ProductSupport[]; label?: string; locale?:Locale; strings:Record<string,string> }) {
  const cardRef=useRef<HTMLElement>(null);
  const availableColors = useMemo(() => {
    const active = catalogColors.filter((color) => color.active);
    if (!product.colors.length || product.colors.includes("Unique")) return active;
    const explicit = active.filter((color) => product.colors.includes(color.name) || product.colors.includes(color.id));
    return explicit.length ? explicit : active;
  }, [catalogColors, product.colors]);
  const [colorId, setColorId] = useState(availableColors[0]?.id ?? "white");
  const [printColor, setPrintColor] = useState<PrintColor>("black");
  const designPreviewColors = useMemo(() => {
    if (!availableColors.length) return [];
    const configured = (product.previewColorIds ?? []).map((id)=>availableColors.find((color)=>color.id===id)).filter((color):color is CatalogColor=>Boolean(color)).slice(0, 3);
    if (configured.length) return configured;
    const offset = stableColourOffset(product.slug, availableColors.length);
    return Array.from({ length: Math.min(3, availableColors.length) }, (_, index) => availableColors[(offset + index * Math.max(1, Math.floor(availableColors.length / 3))) % availableColors.length]);
  }, [availableColors, product.previewColorIds, product.slug]);
  const designBackground = designPreviewColors[stableColourOffset(product.slug, designPreviewColors.length)];
  const availableSupports = useMemo(() => supports.filter((support) => support.active && !product.disabledSupports?.includes(support.id)), [product.disabledSupports, supports]);
  const previewSupports = useMemo(() => {
    const tshirt = availableSupports.find((support) => support.id.startsWith("tshirt-"));
    return availableSupports.filter((support) => !support.id.startsWith("tshirt-")).concat(tshirt ? [{ ...tshirt, name:"T-shirt" }] : []);
  }, [availableSupports]);
  const slides = useMemo(() => {
    const order = ["tshirt-150", "tshirt-190", "hoodie", "long-sleeve", "tote-bag"];
    return [{ id:"design", name:strings.designOnly, templateImage:"" }, ...previewSupports.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))];
  }, [previewSupports, strings.designOnly]);
  const [slideIndex, setSlideIndex] = useState(0);
  const slide = slides[Math.min(slideIndex, slides.length - 1)] ?? slides[0];
  const color = availableColors.find((item) => item.id === colorId) ?? availableColors[0];
  const badges = useMemo(() => cardBadges(product, { new: label || strings.new || "New", bestSeller: strings.bestSeller || "Best seller" }), [label, product, strings.new, strings.bestSeller]);
  const supportIcon = (id:string) => id === "design" ? <ImageIcon className="size-3 sm:size-5"/> : <span className="[&_img]:size-3 sm:[&_img]:size-6"><SupportIcon supportId={id} size={24}/></span>;

  useEffect(()=>{const element=cardRef.current;if(!element)return;const observer=new IntersectionObserver((entries)=>{if(entries[0]?.isIntersecting){trackEvent("product_impression",{entityType:"product",entityId:product.slug,metadata:{source:"product_grid"}});observer.disconnect();}},{threshold:.5});observer.observe(element);return()=>observer.disconnect();},[product.slug]);

  return <article ref={cardRef} id={`mim-product-${product.slug}`} className="mim-product-card group flex min-w-0 flex-col border border-white/10 text-[var(--foreground)]">
    <div className="mim-product-card__visual relative aspect-square overflow-hidden border border-white/10 bg-[var(--surface)]">
      <Link href={`/designs/${product.slug}`} onClick={()=>trackEvent("product_click",{entityType:"product",entityId:product.slug,metadata:{source:"product_grid"}})} className="absolute inset-0" aria-label={`Open ${product.name}`}>
        {slide?.id === "design" ? <div className="mim-product-card__design-preview absolute inset-0 grid place-items-center p-[10%] transition-colors duration-500" style={{backgroundColor:designBackground?.hex ?? "#dedbd2",backgroundImage:"radial-gradient(circle at 22% 15%, rgba(255,255,255,.24), transparent 36%), repeating-linear-gradient(118deg, rgba(255,255,255,.035) 0 1px, rgba(0,0,0,.025) 1px 3px)"}}><div className="relative size-full"><Image src={product.image} alt={product.imageAlt || product.name} title={product.imageTitle || undefined} fill sizes="(max-width: 1023px) 50vw, 33vw" unoptimized={product.image.startsWith("http")} className="object-contain drop-shadow-2xl" style={product.monochrome ? {filter:printColor === "white" ? "grayscale(1) brightness(0) invert(1)" : "grayscale(1) brightness(0)"} : undefined}/></div></div> : slide && "defaultPlacement" in slide ? <ProductMockup artwork={product.image} color={color?.name ?? "White"} name={product.name} templateImage={slide.templateImage} supportId={slide.id} printColor={product.monochrome ? printColor : "original"} placements={{[slide.id]:slide.defaultPlacement,...product.artworkPlacements}} /> : null}
      </Link>
      {badges.length > 0 && <div className="mim-product-card__badges pointer-events-none absolute left-2 top-2 z-10 flex max-w-[70%] flex-col items-start gap-1 sm:left-4 sm:top-4 sm:gap-1.5">{badges.map((badge)=><span key={badge.key} className={`mim-product-card__badge mim-product-card__badge--${badge.key} max-w-full truncate rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[.1em] sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[.12em] ${badge.key==="promo"?"bg-[#ff4f1f] text-white":badge.key==="best"?"bg-white text-[#111]":badge.key==="category"?"bg-black/70 text-white backdrop-blur":"bg-[var(--accent-brand)] text-[#111]"}`}>{badge.label}</span>)}</div>}
      {product.monochrome && <div className="mim-product-card__print-colours absolute right-2 top-2 z-10 flex gap-1 sm:right-4 sm:top-4 sm:gap-2" aria-label={strings.printColour}>
        {(["black","white"] as PrintColor[]).map((item)=><button key={item} type="button" onClick={()=>{setPrintColor(item);trackEvent("product_configure",{entityType:"product",entityId:product.slug,metadata:{source:"product_grid",option:"print_color",value:item}});}} aria-label={item === "black" ? strings.blackPrint : strings.whitePrint} aria-pressed={printColor===item} className="group/print relative grid size-5 place-items-center rounded-full bg-black/35 backdrop-blur sm:size-8"><span className={`size-4 rounded-full border transition sm:size-6 sm:border-2 ${item==="black"?"bg-black":"bg-white"} ${printColor===item?"scale-110 border-[var(--accent-brand)]":"border-white/45"}`}/><span role="tooltip" className="pointer-events-none absolute top-[calc(100%+.45rem)] right-0 hidden w-max rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-black shadow-xl group-hover/print:block group-focus-visible/print:block">{item === "black" ? strings.blackPrint : strings.whitePrint}</span></button>)}
      </div>}
      {slide?.id !== "design" && <div className="mim-product-card__garment-colours scrollbar-none absolute bottom-2 left-2 right-2 z-10 flex snap-x gap-1 overflow-x-auto border-0 bg-transparent p-0 shadow-none sm:bottom-4 sm:left-4 sm:right-4 sm:gap-2" aria-label={strings.garmentColours}>
          {availableColors.map((item) => <button key={item.id} type="button" onClick={()=>{setColorId(item.id);trackEvent("product_configure",{entityType:"product",entityId:product.slug,metadata:{source:"product_grid",option:"color",value:item.id}});}} className="group/swatch relative shrink-0 snap-center py-0.5 sm:py-1" aria-label={item.name} aria-pressed={color?.id===item.id}>
            <span className={`block size-4 rounded-full border transition sm:size-7 sm:border-2 ${color?.id===item.id?"scale-110 border-white":"border-white/25"}`} style={{backgroundColor:item.hex}} />
            <span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 z-20 hidden w-max max-w-24 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold leading-tight text-black shadow-xl group-hover/swatch:block group-focus-visible/swatch:block">{item.name}</span>
          </button>)}
      </div>}
    </div>
    <div className="mim-product-card__details min-w-0 flex-1 pt-2 sm:pt-3"><Link href={`/designs/${product.slug}`} onClick={()=>trackEvent("product_click",{entityType:"product",entityId:product.slug,metadata:{source:"product_title"}})}><h3 className="mim-product-card__title mt-0.5 line-clamp-2 text-sm font-black uppercase leading-tight tracking-[-.025em] sm:mt-1 sm:text-xl">{product.name}</h3></Link></div>
    <div className="mim-product-card__bar mt-2 flex min-w-0 items-center justify-between gap-1 bg-black px-1 py-1.5 sm:mt-3 sm:gap-3 sm:px-3 sm:py-2.5">
      <div className="mim-product-card__support-selector flex min-w-0 flex-1 items-center gap-0.5 sm:gap-2" aria-label={strings.support}>
      {slides.map((item,index)=><button key={item.id} type="button" onClick={()=>{setSlideIndex(index);trackEvent("product_configure",{entityType:"product",entityId:product.slug,metadata:{source:"product_grid",option:"support",value:item.id}});}} aria-label={item.name} aria-pressed={slide?.id===item.id} title={item.name} className={`mim-product-card__support group/support relative grid size-[22px] shrink-0 place-items-center rounded-full border transition sm:size-10 ${slide?.id===item.id?"border-[var(--accent-brand)] bg-[var(--accent-brand)] text-[#171715]":"border-white/10 bg-white/[.28] text-[#242421] hover:bg-white/45 hover:text-[#151513]"}`}>{supportIcon(item.id)}<span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 z-30 hidden w-max max-w-28 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold text-black shadow-xl group-hover/support:block group-focus-visible/support:block">{item.name}</span></button>)}
      </div>
      <strong className="mim-product-card__price shrink-0 whitespace-nowrap bg-white px-1.5 py-0.5 text-[11px] text-black sm:px-3 sm:py-1 sm:text-lg">{slide && "priceCents" in slide?cardPrice(slide.priceCents):product.price.replace(/,00\s*€$/," €")}</strong>
    </div>
  </article>;
}
