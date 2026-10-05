import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { localizedBlock, type PageBlock as PageBlockData } from "@/lib/page-blocks";

export function PageBlock({ block, children, locale="en", editor = false, selected = false, onSelect }: { block:PageBlockData; children?:ReactNode; locale?:string; editor?:boolean; selected?:boolean; onSelect?:()=>void }) {
  const hero = block.type === "Hero";
  const blockWidth = block.width ?? (hero ? "full" : "content");
  const blockSpacing = block.spacing ?? (hero ? "large" : "normal");
  const blockAlign = block.align ?? "left";
  const width = blockWidth === "narrow" ? "max-w-3xl" : blockWidth === "full" ? "max-w-none" : "max-w-[1440px]";
  const spacing = blockSpacing === "compact" ? "py-8" : blockSpacing === "large" ? "py-20" : "py-12";
  const storedBackground = block.background ?? (hero ? "var(--accent-brand)" : block.type === "Banner" ? "#050505" : "transparent");
  const background = storedBackground === "#ffffff" ? "var(--surface)" : storedBackground;
  const darkContentBlock = ["Produtos", "Coleções", "Texto"].includes(block.type) && ["transparent", "var(--paper)", "var(--surface)"].includes(background);
  const textColor = darkContentBlock ? "var(--foreground)" : block.textColor ?? (hero ? "#11110f" : "var(--foreground)");
  const copy = localizedBlock(block, locale);
  const blockHook = block.type.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const blockId = block.type === "Produtos" ? "novidades" : block.type === "Coleções" ? "colecoes" : `mim-block-${block.id}`;
  return <section id={blockId} data-mim-block-id={block.id} onClick={onSelect} className={`mim-page-block mim-page-block--${blockHook} relative overflow-hidden ${width} ${spacing} ${blockWidth === "full" ? "" : "mx-auto"} ${editor ? `cursor-pointer outline outline-2 outline-offset-[-2px] ${selected ? "outline-[var(--brand)]" : "outline-transparent hover:outline-black/15"}` : ""}`} style={{background,color:textColor}}>
    {block.imageUrl&&<Image src={block.imageUrl} alt="" fill sizes="100vw" unoptimized={block.imageUrl.startsWith("http")} className="object-cover opacity-45"/>}
    <div className={`mim-page-block__content relative ${blockWidth === "full" ? "mx-auto max-w-[1440px] px-5 lg:px-10" : block.type === "Produtos" ? "px-2.5 sm:px-5 lg:px-10" : "px-5 lg:px-10"} ${blockAlign === "center" ? "text-center" : "text-left"}`}>
      {copy.eyebrow&&<p className="text-sm font-black uppercase tracking-[.16em] opacity-70">{copy.eyebrow}</p>}
      <h2 className={`${hero ? "mt-5 text-[clamp(3.4rem,8vw,7.8rem)] leading-[.78]" : "mt-3 text-4xl md:text-6xl"} font-black uppercase tracking-[-.065em]`}>{copy.title}</h2>
      {copy.description&&<p className={`${blockAlign === "center" ? "mx-auto" : ""} mt-6 max-w-2xl text-lg leading-relaxed opacity-75`}>{copy.description}</p>}
      {copy.ctaLabel&&block.ctaUrl&&(editor?<span className="mt-8 inline-flex bg-[var(--ink)] px-7 py-4 font-black uppercase text-white">{copy.ctaLabel}</span>:<Link href={block.ctaUrl} className="mt-8 inline-flex bg-[var(--ink)] px-7 py-4 font-black uppercase text-white">{copy.ctaLabel}</Link>)}
      {children&&<div className="mt-8 text-left">{children}</div>}
    </div>
  </section>;
}
