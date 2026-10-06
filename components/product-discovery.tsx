import Link from "next/link";
import { ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { ProductMockup } from "@/components/product-mockup";
import { BrandLogo } from "@/components/brand-logo";

export type RelatedProduct = {
  slug:string;
  name:string;
  imageKey:string|null;
  priceCents:number;
  collection:string;
};

export function ProductDiscovery({ related, collection }: { related:RelatedProduct[]; collection:string }) {
  return (
    <>
      <section className="mx-auto grid max-w-[1440px] gap-0 px-5 py-14 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div className="flex min-h-96 flex-col justify-between bg-[var(--ink)] p-8 text-white sm:p-12">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-[var(--accent-brand)]"><Sparkles className="size-4"/> The shoulder tag</p>
            <h2 className="mt-5 max-w-xl text-5xl font-black uppercase leading-[.84] tracking-[-.06em] sm:text-7xl">The logo never tells the same story twice.</h2>
          </div>
          <p className="mt-12 max-w-xl text-lg leading-relaxed text-white/65">Every Made in Maia piece carries a Link Label. Open it and every visit reveals a different story, image, video, idea or local surprise.</p>
        </div>
        <div className="flex min-h-96 flex-col justify-between bg-[var(--accent-brand)] p-8 sm:p-12">
          <BrandLogo className="h-36 w-auto" />
          <div>
            <p className="max-w-md text-xl font-bold">One symbol. An endless doorway into Made in Maia.</p>
            <Link href="/linklabel" className="mt-7 inline-flex items-center gap-3 bg-[var(--ink)] px-7 py-4 font-black uppercase text-white">Open Link Label <RefreshCw className="size-4"/></Link>
          </div>
        </div>
      </section>

      {related.length > 0 && <section className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div><p className="text-xs font-black uppercase tracking-[.18em] text-[var(--brand)]">{collection}</p><h2 className="mt-2 text-4xl font-black uppercase tracking-[-.05em] sm:text-6xl">Keep exploring.</h2></div>
          <Link href={`/loja?q=${encodeURIComponent(collection)}`} className="hidden items-center gap-2 font-black uppercase underline sm:flex">See the collection <ArrowRight className="size-4"/></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((product) => <article key={product.slug} className="group">
            <Link href={`/designs/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white">
              <ProductMockup artwork={product.imageKey || "/products/white-shirt-1.jpg"} color="White" name={product.name} />
            </Link>
            <div className="flex items-start justify-between gap-4 pt-4"><div><p className="text-xs uppercase opacity-50">{product.collection}</p><h3 className="text-lg font-black uppercase">{product.name}</h3></div><strong>{(product.priceCents/100).toFixed(2).replace(".",",")} €</strong></div>
          </article>)}
        </div>
      </section>}
    </>
  );
}
