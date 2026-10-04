"use client";

import { useMemo, useRef, useState } from "react";
import { Grip, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductMockup } from "@/components/product-mockup";
import { artworkPlacement, clampPlacement, type ArtworkPlacement, type ArtworkPlacements } from "@/lib/artwork-placement";
import type { ProductSupport } from "@/lib/product-catalog";

type Props={open:boolean;onOpenChange:(open:boolean)=>void;name:string;artwork:string;supports:ProductSupport[];placements:ArtworkPlacements;onSave:(placements:ArtworkPlacements)=>void};

export function ArtworkPlacementEditor({open,onOpenChange,name,artwork,supports,placements,onSave}:Props) {
  const available=useMemo(()=>supports.filter((item)=>item.active),[supports]);
  const [supportId,setSupportId]=useState(available[0]?.id??"tshirt-150");
  const [draft,setDraft]=useState<ArtworkPlacements>(placements);
  const stageRef=useRef<HTMLDivElement>(null);
  const current=artworkPlacement(supportId,draft);

  function begin(event:React.PointerEvent<HTMLDivElement>,mode:"move"|"resize") {
    event.preventDefault(); event.stopPropagation();
    const stage=stageRef.current; if(!stage)return;
    const startX=event.clientX,startY=event.clientY,start={...current},rect=stage.getBoundingClientRect();
    const target=event.currentTarget; target.setPointerCapture(event.pointerId);
    const move=(next:PointerEvent)=>{
      const dx=(next.clientX-startX)/rect.width*100,dy=(next.clientY-startY)/rect.height*100;
      const value:ArtworkPlacement=mode==="move"?{...start,x:start.x+dx,y:start.y+dy}:{...start,width:start.width+dx,height:start.height+dy};
      setDraft((all)=>({...all,[supportId]:clampPlacement(value)}));
    };
    const stop=()=>{target.removeEventListener("pointermove",move);target.removeEventListener("pointerup",stop);target.removeEventListener("pointercancel",stop);};
    target.addEventListener("pointermove",move);target.addEventListener("pointerup",stop);target.addEventListener("pointercancel",stop);
  }

  return <Dialog open={open} onOpenChange={(next)=>{if(next)setDraft(placements);onOpenChange(next);}}>
    <DialogContent className="max-h-[94vh] overflow-y-auto rounded-none border-black/10 bg-[#ecece8] text-[#171713] sm:max-w-5xl">
      <DialogHeader><DialogTitle className="text-2xl font-black uppercase">Posicionamento do design</DialogTitle><DialogDescription>Arrasta a caixa para mover. Usa o canto inferior direito para redimensionar. Cada suporte guarda uma posição independente.</DialogDescription></DialogHeader>
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-2">{available.map((support)=><button key={support.id} type="button" onClick={()=>setSupportId(support.id)} className={`w-full border px-4 py-3 text-left text-sm font-black ${supportId===support.id?"border-black bg-black text-white":"border-black/15 bg-white"}`}>{support.name}</button>)}<Button type="button" variant="outline" className="mt-4 w-full rounded-none" onClick={()=>setDraft((all)=>{const next={...all};delete next[supportId];return next;})}><RotateCcw/>Repor este suporte</Button><dl className="grid grid-cols-2 gap-2 bg-white p-3 text-xs"><div><dt className="opacity-50">X</dt><dd className="font-mono font-bold">{current.x.toFixed(1)}%</dd></div><div><dt className="opacity-50">Y</dt><dd className="font-mono font-bold">{current.y.toFixed(1)}%</dd></div><div><dt className="opacity-50">Largura</dt><dd className="font-mono font-bold">{current.width.toFixed(1)}%</dd></div><div><dt className="opacity-50">Altura</dt><dd className="font-mono font-bold">{current.height.toFixed(1)}%</dd></div></dl></aside>
        <div ref={stageRef} className="relative mx-auto aspect-[4/5] w-full max-w-[580px] touch-none overflow-hidden border border-black/15 bg-[#ddd] select-none">
          <ProductMockup artwork={artwork} color="White" name={name} supportId={supportId} templateImage={available.find((item)=>item.id===supportId)?.templateImage} placements={draft}/>
          <div onPointerDown={(event)=>begin(event,"move")} className="absolute z-20 cursor-move border-2 border-dashed border-[var(--brand)] bg-orange-400/10 shadow-[0_0_0_1px_rgba(255,255,255,.7)]" style={{left:`${current.x}%`,top:`${current.y}%`,width:`${current.width}%`,height:`${current.height}%`}} aria-label="Área do design">
            <span className="absolute -left-px -top-7 bg-[var(--brand)] px-2 py-1 text-[10px] font-black uppercase text-white">Arrastar</span>
            <div onPointerDown={(event)=>begin(event,"resize")} className="absolute -bottom-3 -right-3 grid size-7 cursor-nwse-resize place-items-center bg-[var(--brand)] text-white shadow"><Grip className="size-4"/></div>
          </div>
        </div>
      </div>
      <DialogFooter><Button type="button" variant="outline" className="rounded-none" onClick={()=>onOpenChange(false)}>Cancelar</Button><Button type="button" className="rounded-none bg-[var(--ink)] text-white" onClick={()=>{onSave(draft);onOpenChange(false);}}>Guardar posicionamento</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
