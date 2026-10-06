"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { ProductMockup } from "@/components/product-mockup";
import { SupportIcon } from "@/components/support-icon";
import type { CatalogColor, ProductSupport } from "@/lib/product-catalog";
import type { Locale } from "@/lib/i18n";
import type { ArtworkPlacements } from "@/lib/artwork-placement";
import { collectionSlug, productTaxonomies } from "@/lib/collections";

type PrintColor = "black" | "white";

function stableColourOffset(value: string, length: number) {
  return length ? [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7) % length : 0;
}

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
  const supportIcon = (id:string) => id === "design" ? <ImageIcon className="size-3 sm:size-5"/> : <span className="[&_img]:size-3 sm:[&_img]:size-6"><SupportIcon supportId={id} size={24}/></span>;
  const taxonomies = productTaxonomies(product).filter((item)=>item.trim().toLowerCase()!=="made in maia");

  return <article id={`mim-product-${product.slug}`} className="mim-product-card group min-w-0 border border-white/10 text-[var(--foreground)]">
    <div className="mim-product-card__visual relative aspect-square overflow-hidden border border-white/10 bg-[var(--surface)]">
      <Link href={`/produto/${product.slug}`} className="absolute inset-0" aria-label={`Open ${product.name}`}>
        {slide?.id === "design" ? <div className="mim-product-card__design-preview absolute inset-0 grid place-items-center p-[10%] transition-colors duration-500" style={{backgroundColor:designBackground?.hex ?? "#dedbd2",backgroundImage:"radial-gradient(circle at 22% 15%, rgba(255,255,255,.24), transparent 36%), repeating-linear-gradient(118deg, rgba(255,255,255,.035) 0 1px, rgba(0,0,0,.025) 1px 3px)"}}><div className="relative size-full"><Image src={product.image} alt={product.name} fill sizes="(max-width: 1023px) 50vw, 33vw" unoptimized={product.image.startsWith("http")} className="object-contain drop-shadow-2xl" style={product.monochrome ? {filter:printColor === "white" ? "grayscale(1) brightness(0) invert(1)" : "grayscale(1) brightness(0)"} : undefined}/></div></div> : slide && "defaultPlacement" in slide ? <ProductMockup artwork={product.image} color={color?.name ?? "White"} name={product.name} templateImage={slide.templateImage} supportId={slide.id} printColor={product.monochrome ? printColor : "original"} placements={{[slide.id]:slide.defaultPlacement,...product.artworkPlacements}} /> : null}
      </Link>
      {label && <span className="mim-product-card__badge absolute left-2 top-2 rounded-full bg-[var(--accent-brand)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[.1em] text-[#111] sm:left-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[.12em]">{label}</span>}
      {product.monochrome && <div className="mim-product-card__print-colours absolute right-2 top-2 z-10 flex gap-1 sm:right-4 sm:top-4 sm:gap-2" aria-label={strings.printColour}>
        {(["black","white"] as PrintColor[]).map((item)=><button key={item} type="button" onClick={()=>setPrintColor(item)} aria-label={item === "black" ? strings.blackPrint : strings.whitePrint} aria-pressed={printColor===item} className="group/print relative grid size-5 place-items-center rounded-full bg-black/35 backdrop-blur sm:size-8"><span className={`size-4 rounded-full border transition sm:size-6 sm:border-2 ${item==="black"?"bg-black":"bg-white"} ${printColor===item?"scale-110 border-[var(--accent-brand)]":"border-white/45"}`}/><span role="tooltip" className="pointer-events-none absolute top-[calc(100%+.45rem)] right-0 hidden w-max rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-black shadow-xl group-hover/print:block group-focus-visible/print:block">{item === "black" ? strings.blackPrint : strings.whitePrint}</span></button>)}
      </div>}
      {slide?.id !== "design" && <div className="mim-product-card__garment-colours scrollbar-none absolute bottom-2 left-2 right-2 z-10 flex snap-x gap-1 overflow-x-auto border-0 bg-transparent p-0 shadow-none sm:bottom-4 sm:left-4 sm:right-4 sm:gap-2" aria-label={strings.garmentColours}>
          {availableColors.map((item) => <button key={item.id} type="button" onClick={()=>setColorId(item.id)} className="group/swatch relative shrink-0 snap-center py-0.5 sm:py-1" aria-label={item.name} aria-pressed={color?.id===item.id}>
            <span className={`block size-4 rounded-full border transition sm:size-7 sm:border-2 ${color?.id===item.id?"scale-110 border-white":"border-white/25"}`} style={{backgroundColor:item.hex}} />
            <span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 z-20 hidden w-max max-w-24 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold leading-tight text-black shadow-xl group-hover/swatch:block group-focus-visible/swatch:block">{item.name}</span>
          </button>)}
      </div>}
    </div>
    <div className="mim-product-card__support-selector grid w-full grid-flow-col auto-cols-fr items-center border-x border-b border-white/10 bg-[var(--surface)] py-1.5 sm:py-3" aria-label={strings.support}>
      {slides.map((item,index)=><button key={item.id} type="button" onClick={()=>setSlideIndex(index)} aria-label={item.name} aria-pressed={slide?.id===item.id} title={item.name} className={`mim-product-card__support group/support relative grid size-6 place-items-center justify-self-center rounded-full border transition sm:size-10 ${slide?.id===item.id?"border-[var(--accent-brand)] bg-[var(--accent-brand)] text-black":"border-white/15 bg-white/80 text-black hover:bg-white"}`}>{supportIcon(item.id)}<span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 z-30 hidden w-max max-w-28 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold text-black shadow-xl group-hover/support:block group-focus-visible/support:block">{item.name}</span></button>)}
    </div>
    <div className="mim-product-card__details flex min-w-0 flex-col gap-1 pt-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pt-4">
      <div className="min-w-0"><nav className="mim-product-card__taxonomies flex min-w-0 flex-wrap gap-x-1 text-[8px] font-bold uppercase tracking-[.1em] text-white/42 sm:text-xs sm:tracking-[.12em]">{taxonomies.map((item,index)=><span key={item} className="inline-flex"><Link className="hover:text-white hover:underline" href={`/colecao/${collectionSlug(item)}`}>{item}</Link>{index<taxonomies.length-1&&<span className="ml-1">·</span>}</span>)}</nav><Link href={`/produto/${product.slug}`}><h3 className="mim-product-card__title mt-0.5 line-clamp-2 text-sm font-black uppercase leading-tight tracking-[-.025em] sm:mt-1 sm:text-xl">{product.name}</h3></Link></div>
      <strong className="shrink-0 bg-white px-2 py-1 text-sm text-black sm:px-3 sm:text-lg">{slide && "priceCents" in slide?`${(slide.priceCents/100).toFixed(2).replace(".",",")} €`:product.price}</strong>
    </div>
  </article>;
}
