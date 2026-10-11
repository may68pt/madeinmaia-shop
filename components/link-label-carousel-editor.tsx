"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  urls: string[];
  uploading: boolean;
  dragActive: boolean;
  onDragActiveChange: (active: boolean) => void;
  onUpload: (files: File[]) => void;
  onChange: (urls: string[]) => void;
};

export function LinkLabelCarouselEditor({ title, urls, uploading, dragActive, onDragActiveChange, onUpload, onChange }: Props) {
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= urls.length) return;
    const next = [...urls];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return <div className="space-y-4">
    <label className={("grid min-h-48 cursor-pointer place-items-center border-2 border-dashed p-6 text-center transition ") + (dragActive ? "border-[var(--accent-brand)] bg-[var(--accent-brand)]/10" : "border-white/20 bg-white/[.03] hover:border-white/45")} onDragEnter={(event)=>{event.preventDefault();onDragActiveChange(true)}} onDragOver={(event)=>event.preventDefault()} onDragLeave={()=>onDragActiveChange(false)} onDrop={(event)=>{event.preventDefault();onDragActiveChange(false);onUpload(Array.from(event.dataTransfer.files).filter((file)=>file.type.startsWith("image/")))}}>
      <span><Images className="mx-auto size-10 text-[var(--accent-brand)]"/><strong className="mt-3 block text-sm uppercase text-white">{uploading ? "A carregar imagens…" : "Larga várias imagens aqui"}</strong><span className="mt-1 block text-xs text-white/50">Ou clica para escolher múltiplos ficheiros · PNG, JPG, WebP ou GIF</span></span>
      <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event)=>{onUpload(Array.from(event.target.files??[]));event.target.value=""}}/>
    </label>
    {urls.length>0&&<div>
      <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-black uppercase text-white">{urls.length} imagens · ordem do carousel</p><Button type="button" variant="outline" size="sm" className="rounded-none" onClick={()=>onChange([])}><Trash2/>Remover todas</Button></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{urls.map((url,index)=><div key={url+"-"+index} className="group relative aspect-square overflow-hidden border border-white/15 bg-[#111]"><Image src={url} alt={title+" "+(index+1)} fill sizes="200px" unoptimized className="object-contain"/><span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-black/75 text-[10px] font-black text-white">{index+1}</span><div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/75 p-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100"><Button type="button" size="icon" variant="ghost" className="size-8 text-white hover:bg-white/15 hover:text-white" disabled={index===0} aria-label="Mover imagem para a esquerda" onClick={()=>move(index,-1)}><ChevronLeft/></Button><Button type="button" size="icon" variant="ghost" className="size-8 text-red-400 hover:bg-white/15 hover:text-red-300" aria-label="Remover imagem" onClick={()=>onChange(urls.filter((_,itemIndex)=>itemIndex!==index))}><Trash2/></Button><Button type="button" size="icon" variant="ghost" className="size-8 text-white hover:bg-white/15 hover:text-white" disabled={index===urls.length-1} aria-label="Mover imagem para a direita" onClick={()=>move(index,1)}><ChevronRight/></Button></div></div>)}</div>
    </div>}
  </div>;
}
