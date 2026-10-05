"use client";

import { useRef } from "react";
import { Grip } from "lucide-react";
import { ProductMockup } from "@/components/product-mockup";
import { clampPlacement, type ArtworkPlacement } from "@/lib/artwork-placement";
import type { ProductSupport } from "@/lib/product-catalog";

export function DefaultPlacementControl({ support, onChange }: { support: ProductSupport; onChange: (placement: ArtworkPlacement) => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const placement = support.defaultPlacement;

  function begin(event: React.PointerEvent<HTMLDivElement>, mode: "move" | "resize") {
    event.preventDefault();
    event.stopPropagation();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const start = { ...placement };
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const move = (next: PointerEvent) => {
      const dx = ((next.clientX - startX) / rect.width) * 100;
      const dy = ((next.clientY - startY) / rect.height) * 100;
      onChange(clampPlacement(mode === "move" ? { ...start, x: start.x + dx, y: start.y + dy } : { ...start, width: start.width + dx, height: start.height + dy }));
    };
    const stop = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", stop);
      target.removeEventListener("pointercancel", stop);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", stop);
    target.addEventListener("pointercancel", stop);
  }

  return <div className="mim-default-placement min-w-0">
    <div ref={stageRef} className="mim-default-placement__stage relative mx-auto aspect-square w-full max-w-[320px] touch-none overflow-hidden rounded-2xl border border-black/15 bg-[#deddd7] select-none">
      <ProductMockup artwork="/uploads/0209-sardines-social-club-web-color-a4a5bf29.png" color="White" name="Placement preview" supportId={support.id} templateImage={support.templateImage} placements={{ [support.id]: placement }} />
      <div onPointerDown={(event) => begin(event, "move")} className="mim-default-placement__box absolute z-20 cursor-move border-2 border-dashed border-[var(--brand)] bg-orange-400/10 shadow-[0_0_0_1px_rgba(255,255,255,.8)]" style={{ left: `${placement.x}%`, top: `${placement.y}%`, width: `${placement.width}%`, height: `${placement.height}%` }} aria-label="Área padrão do design">
        <span className="absolute -left-px -top-6 bg-[var(--brand)] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">Design</span>
        <div onPointerDown={(event) => begin(event, "resize")} className="absolute -bottom-3 -right-3 grid size-7 cursor-nwse-resize place-items-center rounded-full bg-[var(--brand)] text-white shadow"><Grip className="size-4" /></div>
      </div>
    </div>
    <p className="mt-2 text-center text-[11px] font-bold text-black/45">Arrasta para posicionar · usa o canto para redimensionar</p>
  </div>;
}
