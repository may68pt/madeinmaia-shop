"use client";

import { useState } from "react";
import { Check, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCartItem } from "@/lib/cart";
import { productColorHex } from "@/lib/product-colors";
import { ProductMockup } from "@/components/product-mockup";

type Props = {
  slug: string;
  name: string;
  description: string;
  collection: string;
  image: string;
  priceCents: number;
  colors: string[];
  sizes: string[];
};

export function ProductPurchase({ slug, name, description, collection, image, priceCents, colors, sizes }: Props) {
  const [color, setColor] = useState(colors[0] ?? "White");
  const [size, setSize] = useState(sizes[0] ?? "Único");
  const [added, setAdded] = useState(false);

  function add() {
    addCartItem({ slug, name, image, priceCents, color, size });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <section className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]">
      <div className="relative min-h-[55vh] bg-white lg:min-h-[calc(100vh-73px)]">
        <ProductMockup artwork={image} color={color} name={name} priority />
        {/\.png(?:$|\?)/i.test(image) && <div className="absolute bottom-5 left-5 bg-white/90 px-3 py-2 text-xs font-bold uppercase backdrop-blur">Pré-visualização · {color}</div>}
      </div>
      <div className="flex items-center p-7 sm:p-12 lg:p-16">
        <div className="w-full max-w-xl">
          <p className="text-sm font-black uppercase tracking-[.16em] text-[var(--brand)]">{collection}</p>
          <h1 className="mt-4 text-5xl font-black uppercase leading-[.9] tracking-[-.06em] sm:text-7xl">{name}</h1>
          <p className="mt-6 text-2xl font-black">{(priceCents / 100).toFixed(2).replace(".", ",")} €</p>
          <p className="mt-6 text-lg leading-relaxed text-black/60">{description || "Desenhada e impressa na Maia em pequenas séries."}</p>
          <div className="mt-9 space-y-7">
            <fieldset>
              <legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Cor — {color}</legend>
              <div className="flex flex-wrap gap-3">
                {colors.map((value) => <button key={value} onClick={() => setColor(value)} title={value} aria-label={`Cor ${value}`} className={`grid size-11 place-items-center rounded-full border-2 transition ${color === value ? "scale-110 border-[var(--ink)]" : "border-black/15"}`}><span className="size-8 rounded-full border border-black/10" style={{ backgroundColor: productColorHex(value) }} /></button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Tamanho — {size}</legend>
              <div className="flex flex-wrap gap-2">{sizes.map((value) => <button key={value} onClick={() => setSize(value)} className={`grid size-12 place-items-center border text-sm font-black ${size === value ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-black/20"}`}>{value}</button>)}</div>
            </fieldset>
            <Button onClick={add} className="h-14 w-full rounded-none bg-[var(--ink)] text-base font-black uppercase text-white">{added ? <><Check />Adicionado</> : <><ShoppingBag />Adicionar ao saco</>}</Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-black/55"><Truck className="size-4" />Envio gratuito em Portugal a partir de 45 €</p>
        </div>
      </div>
    </section>
  );
}
