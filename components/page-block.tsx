import Link from "next/link";
import type { ReactNode } from "react";
import type { PageBlock as PageBlockData } from "@/lib/page-blocks";

export function PageBlock({ block, children, editor = false, selected = false, onSelect }: { block:PageBlockData; children?:ReactNode; editor?:boolean; selected?:boolean; onSelect?:()=>void }) {
  const hero = block.type === "Hero";
  const blockWidth = block.width ?? (hero ? "full" : "content");
  const blockSpacing = block.spacing ?? (hero ? "large" : "normal");
  const blockAlign = block.align ?? "left";
  const width = blockWidth === "narrow" ? "max-w-3xl" : blockWidth === "full" ? "max-w-none" : "max-w-[1440px]";
  const spacing = blockSpacing === "compact" ? "py-8" : blockSpacing === "large" ? "py-20" : "py-12";
  const background = block.background ?? (hero ? "var(--accent-brand)" : block.type === "Banner" ? "var(--ink)" : "transparent");
  const textColor = block.textColor ?? (block.type === "Banner" ? "white" : "var(--ink)");
  return <section id={block.type === "Produtos" ? "novidades" : undefined} onClick={onSelect} className={`${width} ${spacing} ${blockWidth === "full" ? "" : "mx-auto"} ${editor ? `cursor-pointer outline outline-2 outline-offset-[-2px] ${selected ? "outline-[var(--brand)]" : "outline-transparent hover:outline-black/15"}` : ""}`} style={{background,color:textColor}}>
    <div className={`${blockWidth === "full" ? "mx-auto max-w-[1440px] px-5 lg:px-10" : "px-5 lg:px-10"} ${blockAlign === "center" ? "text-center" : "text-left"}`}>
      {block.eyebrow&&<p className="text-sm font-black uppercase tracking-[.16em] opacity-70">{block.eyebrow}</p>}
      <h2 className={`${hero ? "mt-5 text-[clamp(3.4rem,8vw,7.8rem)] leading-[.78]" : "mt-3 text-4xl md:text-6xl"} font-black uppercase tracking-[-.065em]`}>{block.title}</h2>
      {block.description&&<p className={`${blockAlign === "center" ? "mx-auto" : ""} mt-6 max-w-2xl text-lg leading-relaxed opacity-75`}>{block.description}</p>}
      {block.ctaLabel&&block.ctaUrl&&<Link href={block.ctaUrl} className="mt-8 inline-flex bg-[var(--ink)] px-7 py-4 font-black uppercase text-white">{block.ctaLabel}</Link>}
      {children&&<div className="mt-8 text-left">{children}</div>}
    </div>
  </section>;
}
