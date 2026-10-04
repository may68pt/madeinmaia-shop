"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductMockup } from "@/components/product-mockup";
import type { CatalogColor } from "@/lib/product-catalog";

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
};

export function ProductCard({ product, catalogColors, label = "New" }: { product: ProductCardData; catalogColors: CatalogColor[]; label?: string }) {
  const availableColors = useMemo(() => {
    const active = catalogColors.filter((color) => color.active);
    if (!product.colors.length || product.colors.includes("Unique")) return active;
    const explicit = active.filter((color) => product.colors.includes(color.name) || product.colors.includes(color.id));
    return explicit.length ? explicit : active;
  }, [catalogColors, product.colors]);
  const [colorId, setColorId] = useState(availableColors[0]?.id ?? "white");
  const [printColor, setPrintColor] = useState<PrintColor>("black");
  const color = availableColors.find((item) => item.id === colorId) ?? availableColors[0];

  return <article className="group min-w-0 text-[var(--foreground)]">
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[var(--surface)]">
      <Link href={`/produto/${product.slug}`} className="absolute inset-0" aria-label={`Open ${product.name}`}>
        <ProductMockup artwork={product.image} color={color?.name ?? "White"} name={product.name} templateImage="/mockup-templates/tshirt-neutral-v1.png" printColor={product.monochrome ? printColor : "original"} />
      </Link>
      <span className="absolute left-4 top-4 rounded-full bg-[var(--accent-brand)] px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] text-[#111]">{label}</span>
      <div className={`scrollbar-none absolute bottom-4 left-4 z-10 flex snap-x gap-2 overflow-x-auto border-0 bg-transparent p-0 shadow-none ${product.monochrome ? "max-w-[calc(100%-7.5rem)]" : "max-w-[calc(100%-2rem)]"}`} aria-label="Garment colours">
          {availableColors.map((item) => <button key={item.id} type="button" onClick={()=>setColorId(item.id)} className="group/swatch relative shrink-0 snap-center py-1" aria-label={item.name} aria-pressed={color?.id===item.id}>
            <span className={`block size-7 rounded-full border-2 transition ${color?.id===item.id?"scale-110 border-white":"border-white/25"}`} style={{backgroundColor:item.hex}} />
            <span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 z-20 hidden w-max max-w-24 -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-center text-[10px] font-bold leading-tight text-black shadow-xl group-hover/swatch:block group-focus-visible/swatch:block">{item.name}</span>
          </button>)}
      </div>
      {product.monochrome && <div className="absolute bottom-4 right-4 z-10 flex gap-2 border-0 bg-transparent p-0 shadow-none" aria-label="Print colour">
        {(["black","white"] as PrintColor[]).map((item)=><button key={item} type="button" onClick={()=>setPrintColor(item)} aria-label={`${item} print`} aria-pressed={printColor===item} className="group/print relative grid size-7 place-items-center rounded-full"><span className={`size-6 rounded-full border-2 shadow-lg transition ${item==="black"?"bg-black":"bg-white"} ${printColor===item?"scale-110 border-[var(--accent-brand)]":"border-white/50"}`}/><span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+.45rem)] left-1/2 hidden w-max -translate-x-1/2 rounded-lg bg-white px-2 py-1 text-[10px] font-bold capitalize text-black shadow-xl group-hover/print:block group-focus-visible/print:block">{item} print</span></button>)}
      </div>}
    </div>
    <div className="flex items-start justify-between gap-4 pt-4">
      <div className="min-w-0"><p className="truncate text-xs font-bold uppercase tracking-[.12em] text-white/42">{product.tags.join(" · ")||product.collection}</p><Link href={`/produto/${product.slug}`}><h3 className="mt-1 text-xl font-black uppercase tracking-[-.025em]">{product.name}</h3></Link></div>
      <strong className="shrink-0 text-lg">{product.price}</strong>
    </div>
  </article>;
}
