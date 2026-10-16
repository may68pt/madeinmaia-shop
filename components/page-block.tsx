import Link from "next/link";
import Image from "next/image";
import { createElement, type FocusEvent, type ReactNode } from "react";
import { localizedBlock, type PageBlock as PageBlockData } from "@/lib/page-blocks";

export function PageBlock({ block, children, locale="en", editor = false, selected = false, onSelect, onEdit, contextTitle }: { block:PageBlockData; children?:ReactNode; locale?:string; editor?:boolean; selected?:boolean; onSelect?:()=>void; onEdit?:(patch:Partial<PageBlockData>)=>void; contextTitle?:string }) {
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
  const dynamicTitle = block.type === "Post Title";
  const inlineImage = Boolean(block.imageUrl && block.type === "Texto");
  const blockHook = block.type.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const blockId = block.type === "Produtos" ? "novidades" : block.type === "Coleções" ? "colecoes" : `mim-block-${block.id}`;
  return <section id={blockId} data-mim-block-id={block.id} onClick={onSelect} className={`mim-page-block mim-page-block--${blockHook} relative overflow-hidden ${width} ${spacing} ${blockWidth === "full" ? "" : "mx-auto"} ${editor ? `cursor-pointer outline outline-2 outline-offset-[-2px] ${selected ? "outline-[var(--brand)]" : "outline-transparent hover:outline-black/15"}` : ""}`} style={{background,color:textColor}}>
    {block.imageUrl&&!inlineImage&&<Image src={block.imageUrl} alt={block.imageAlt??""} fill sizes="100vw" unoptimized={block.imageUrl.startsWith("http")} className="object-cover opacity-45"/>}
    <div className={`mim-page-block__content relative ${block.type === "Produtos" ? "w-full px-0" : blockWidth === "full" ? "mx-auto max-w-[1440px] px-5 lg:px-10" : "px-5 lg:px-10"} ${blockAlign === "center" ? "text-center" : "text-left"}`}>
      {inlineImage&&<figure className="mb-10"><div className="relative aspect-[16/9] overflow-hidden bg-black/20"><Image src={block.imageUrl!} alt={block.imageAlt??block.title} fill sizes="(max-width: 768px) 100vw, 900px" unoptimized={block.imageUrl!.startsWith("http")} className="object-cover"/></div>{(block.imageCaption||block.imageCredit)&&<figcaption className="mt-3 flex flex-wrap justify-between gap-2 text-xs leading-relaxed opacity-60"><span>{block.imageCaption}</span>{block.imageCredit&&(block.imageCreditUrl?<Link href={block.imageCreditUrl} target="_blank" rel="noreferrer" className="underline">{block.imageCredit}</Link>:<span>{block.imageCredit}</span>)}</figcaption>}</figure>}
      {!dynamicTitle&&(copy.eyebrow||editor)&&<p contentEditable={editor} suppressContentEditableWarning {...(editor?{onBlur:(event:FocusEvent<HTMLParagraphElement>)=>onEdit?.({eyebrow:event.currentTarget.textContent??""})}:{})} data-placeholder="Add eyebrow" className="mim-inline-edit text-sm font-black uppercase tracking-[.16em] opacity-70 outline-none">{copy.eyebrow}</p>}
      {dynamicTitle ? createElement(block.headingTag??"h1", {className:"mim-dynamic-title font-black",style:{fontSize:block.fontSize?`${block.fontSize}px`:undefined,fontWeight:block.fontWeight??900,letterSpacing:block.letterSpacing?`${block.letterSpacing}px`:undefined}}, contextTitle??(editor?"Current post title":"")) : createElement(hero?"h1":"h2", {contentEditable:editor,suppressContentEditableWarning:true,...(editor?{onBlur:(event:FocusEvent<HTMLHeadingElement>)=>onEdit?.({title:event.currentTarget.textContent??""})}:{}),"data-placeholder":"Add title",className:`mim-inline-edit ${hero ? "mt-5 text-[clamp(3.4rem,8vw,7.8rem)] leading-[.78]" : "mt-3 text-4xl md:text-6xl"} font-black uppercase tracking-[-.065em] outline-none`}, copy.title)}
      {!dynamicTitle&&(copy.description||editor)&&<p contentEditable={editor} suppressContentEditableWarning {...(editor?{onBlur:(event:FocusEvent<HTMLParagraphElement>)=>onEdit?.({description:event.currentTarget.textContent??""})}:{})} data-placeholder="Add description" className={`mim-inline-edit ${blockAlign === "center" ? "mx-auto" : ""} mt-6 max-w-2xl text-lg leading-relaxed opacity-75 outline-none`}>{copy.description}</p>}
      {!dynamicTitle&&(copy.ctaLabel||editor)&&block.ctaUrl&&(editor?<span contentEditable suppressContentEditableWarning onBlur={(event)=>onEdit?.({ctaLabel:event.currentTarget.textContent??""})} data-placeholder="Button label" className="mim-inline-edit mt-8 inline-flex bg-[var(--ink)] px-7 py-4 font-black uppercase text-white outline-none">{copy.ctaLabel}</span>:<div className="mt-8 flex flex-wrap gap-2"><Link href={block.ctaUrl} {...(block.ctaUrl.startsWith("http")?{target:"_blank",rel:"noreferrer"}:{})} className="inline-flex bg-[var(--ink)] px-7 py-4 font-black uppercase text-white">{copy.ctaLabel}</Link>{block.secondaryCtaLabel&&block.secondaryCtaUrl&&<Link href={block.secondaryCtaUrl} {...(block.secondaryCtaUrl.startsWith("http")?{target:"_blank",rel:"noreferrer"}:{})} className="inline-flex border border-current px-7 py-4 font-black uppercase">{block.secondaryCtaLabel}</Link>}</div>)}
      {children&&<div className="mt-8 text-left">{children}</div>}
    </div>
    {block.imageUrl&&!inlineImage&&block.imageCredit&&<div className="absolute bottom-3 right-5 z-10 text-[10px] opacity-65">{block.imageCreditUrl?<Link href={block.imageCreditUrl} target="_blank" rel="noreferrer" className="underline">{block.imageCredit}</Link>:block.imageCredit}</div>}
  </section>;
}
