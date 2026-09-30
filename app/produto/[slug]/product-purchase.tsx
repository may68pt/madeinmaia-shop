"use client";

import { useState } from "react";
import { Check, ShoppingBag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addCartItem } from "@/lib/cart";
import { productColorHex } from "@/lib/product-colors";
import { ProductMockup } from "@/components/product-mockup";
import { productTypeLabel, type ProductVariant } from "@/lib/product-variants";

type Props = {
  slug: string;
  name: string;
  description: string;
  collection: string;
  image: string;
  priceCents: number;
  colors: string[];
  sizes: string[];
  variants: ProductVariant[];
};

export function ProductPurchase({ slug, name, description, collection, image, priceCents, colors, sizes, variants }: Props) {
  const activeVariants = variants.filter((variant) => variant.active !== false);
  const productTypes = [...new Set(activeVariants.map((variant) => variant.type || "adult-tshirt"))];
  const [productType, setProductType] = useState(productTypes[0] ?? "adult-tshirt");
  const initialColors = activeVariants.length ? [...new Set(activeVariants.filter((variant) => (variant.type || "adult-tshirt") === (productTypes[0] ?? "adult-tshirt")).map((variant) => variant.color))] : colors;
  const [color, setColor] = useState(initialColors[0] ?? "White");
  const initialSizes = activeVariants.length ? activeVariants.filter((variant) => (variant.type || "adult-tshirt") === (productTypes[0] ?? "adult-tshirt") && variant.color === (initialColors[0] ?? "White")).map((variant) => variant.size) : sizes;
  const [size, setSize] = useState(initialSizes[0] ?? "Único");
  const [added, setAdded] = useState(false);
  const availableColors = activeVariants.length ? [...new Set(activeVariants.filter((variant) => (variant.type || "adult-tshirt") === productType).map((variant) => variant.color))] : colors;
  const availableSizes = activeVariants.length ? activeVariants.filter((variant) => (variant.type || "adult-tshirt") === productType && variant.color === color) : sizes.map((value) => ({ size: value, stock: 999 }));
  const selectedVariant = activeVariants.find((variant) => (variant.type || "adult-tshirt") === productType && variant.color === color && variant.size === size);
  const canAdd = !activeVariants.length || Boolean(selectedVariant && selectedVariant.stock > 0);

  function add() {
    if (!canAdd) return;
    addCartItem({ slug, name, image, priceCents, productType, color, size });
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
            {productTypes.length > 0 && <fieldset><legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Tipo de peça</legend><div className="flex flex-wrap gap-2">{productTypes.map((value) => <button key={value} onClick={() => { const nextColors = [...new Set(activeVariants.filter((variant) => (variant.type || "adult-tshirt") === value).map((variant) => variant.color))]; const nextColor = nextColors[0] ?? color; const nextSize = activeVariants.find((variant) => (variant.type || "adult-tshirt") === value && variant.color === nextColor)?.size ?? size; setProductType(value); setColor(nextColor); setSize(nextSize); }} className={`border px-4 py-3 text-sm font-bold ${productType === value ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-black/20"}`}>{productTypeLabel(value)}</button>)}</div></fieldset>}
            <fieldset>
              <legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Cor — {color}</legend>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((value) => <button key={value} onClick={() => { setColor(value); setSize(activeVariants.find((variant) => (variant.type || "adult-tshirt") === productType && variant.color === value)?.size ?? size); }} title={value} aria-label={`Cor ${value}`} className={`grid size-11 place-items-center rounded-full border-2 transition ${color === value ? "scale-110 border-[var(--ink)]" : "border-black/15"}`}><span className="size-8 rounded-full border border-black/10" style={{ backgroundColor: productColorHex(value) }} /></button>)}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-black uppercase tracking-[.16em]">Tamanho — {size}</legend>
              <div className="flex flex-wrap gap-2">{availableSizes.map((variant) => <button key={variant.size} disabled={variant.stock <= 0} onClick={() => setSize(variant.size)} className={`grid size-12 place-items-center border text-sm font-black disabled:cursor-not-allowed disabled:opacity-30 ${size === variant.size ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-black/20"}`}>{variant.size}</button>)}</div>
            </fieldset>
            <Button onClick={add} disabled={!canAdd} className="h-14 w-full rounded-none bg-[var(--ink)] text-base font-black uppercase text-white">{added ? <><Check />Adicionado</> : !canAdd ? "Sem stock" : <><ShoppingBag />Adicionar ao saco</>}</Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-black/55"><Truck className="size-4" />Envio gratuito em Portugal a partir de 45 €</p>
        </div>
      </div>
    </section>
  );
}
