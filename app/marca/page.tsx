import Link from "next/link";
import { ArrowLeft, MapPin, Scissors, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function BrandPage() {
  const values=[
    {icon:MapPin,title:"Da Maia para todo o lado",text:"Uma marca independente com os pés na cidade e os olhos no mundo."},
    {icon:Scissors,title:"Produção consciente",text:"Pequenas quantidades, impressão cuidada e menos desperdício."},
    {icon:Sparkles,title:"Cada peça é uma Link Label",text:"Designs que provocam uma conversa — e uma label que abre conteúdo diferente em cada visita."},
  ];
  return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-[var(--foreground)]">
    <header className="flex items-center justify-between border-b border-white/10 px-5 py-3 lg:px-10"><Link href="/loja" className="flex items-center gap-2 font-black uppercase"><ArrowLeft className="size-4"/>Loja</Link><Link href="/loja" aria-label="Made in Maia shop"><BrandLogo className="h-16 w-auto" /></Link></header>
    <section className="grid min-h-[72vh] lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-[var(--accent-brand)] p-8 text-[var(--ink)] sm:p-12 lg:p-16"><p className="text-sm font-black uppercase tracking-[.18em]">A marca</p><h1 className="my-20 text-[clamp(4rem,10vw,9rem)] font-black uppercase leading-[.76] tracking-[-.075em]">Ideias com sotaque local.</h1><p className="max-w-xl text-xl leading-relaxed">A Made in Maia transforma referências, humor e cultura em peças para usar todos os dias. Pensada na Maia, produzida em pequenas séries e feita para circular.</p></div>
      <div className="grid content-center gap-10 bg-[var(--surface)] p-8 text-white sm:p-12 lg:p-16">{values.map(({icon:Icon,title,text})=><article key={title} className="border-t border-white/20 pt-6"><Icon className="mb-5 text-[var(--accent-brand)]"/><h2 className="text-3xl font-black uppercase tracking-[-.04em]">{title}</h2><p className="mt-3 max-w-lg text-white/65">{text}</p></article>)}</div>
    </section>
  </main>;
}
