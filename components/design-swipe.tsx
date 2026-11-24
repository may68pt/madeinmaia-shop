"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Heart, ShoppingBag, ThumbsDown } from "lucide-react";

type SwipeProduct={slug:string;name:string;imageKey:string|null};
type SailDirection="left"|"right"|"up";

const SAIL_MS=340;
const X_THRESHOLD=110;
const Y_THRESHOLD=120;

function sendVote(productSlug:string,value:-1|1){
  try{
    let visitorId=localStorage.getItem("mim-feedback-id");
    if(!visitorId){visitorId=crypto.randomUUID();localStorage.setItem("mim-feedback-id",visitorId);}
    void fetch("/api/design-feedback",{method:"POST",keepalive:true,headers:{"content-type":"application/json"},body:JSON.stringify({productSlug,visitorId,vote:value})}).catch(()=>{});
  }catch{}
}

export function DesignSwipe({products}:{products:SwipeProduct[]}){
  const router=useRouter();
  const [index,setIndex]=useState(0);
  const [drag,setDrag]=useState({x:0,y:0});
  const [dragging,setDragging]=useState(false);
  const [sailing,setSailing]=useState<SailDirection|null>(null);
  const start=useRef<{x:number;y:number;id:number}|null>(null);
  const product=products.length?products[index%products.length]:undefined;
  const nextProduct=products.length>1?products[(index+1)%products.length]:undefined;

  const sail=useCallback((direction:SailDirection)=>{
    if(!product||sailing)return;
    setSailing(direction);
    const reduce=typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(()=>{
      if(direction==="up"){router.push(`/designs/${product.slug}`);return;}
      sendVote(product.slug,direction==="right"?1:-1);
      setIndex((current)=>current+1);
      setDrag({x:0,y:0});
      setSailing(null);
    },reduce?0:SAIL_MS);
  },[product,sailing,router]);

  useEffect(()=>{
    function onKey(event:KeyboardEvent){
      if(event.target instanceof HTMLElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))return;
      if(event.key==="ArrowRight"){event.preventDefault();sail("right");}
      else if(event.key==="ArrowLeft"){event.preventDefault();sail("left");}
      else if(event.key==="ArrowUp"){event.preventDefault();sail("up");}
    }
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[sail]);

  function onPointerDown(event:ReactPointerEvent<HTMLDivElement>){
    if(sailing||event.button!==0)return;
    start.current={x:event.clientX,y:event.clientY,id:event.pointerId};
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }
  function onPointerMove(event:ReactPointerEvent<HTMLDivElement>){
    if(!start.current||start.current.id!==event.pointerId)return;
    setDrag({x:event.clientX-start.current.x,y:Math.min(0,event.clientY-start.current.y)});
  }
  function onPointerEnd(event:ReactPointerEvent<HTMLDivElement>){
    if(!start.current||start.current.id!==event.pointerId)return;
    start.current=null;
    setDragging(false);
    if(drag.y<-Y_THRESHOLD&&Math.abs(drag.y)>Math.abs(drag.x))sail("up");
    else if(drag.x>X_THRESHOLD)sail("right");
    else if(drag.x<-X_THRESHOLD)sail("left");
    else setDrag({x:0,y:0});
  }

  if(!product)return <p className="p-10 text-center">No designs available.</p>;

  const width=typeof window!=="undefined"?window.innerWidth:800;
  const height=typeof window!=="undefined"?window.innerHeight:900;
  let x=drag.x,y=drag.y,rotate=drag.x/14;
  if(sailing==="right"){x=width*1.2;y=drag.y-40;rotate=28;}
  if(sailing==="left"){x=-width*1.2;y=drag.y-40;rotate=-28;}
  if(sailing==="up"){x=drag.x;y=-height*1.1;rotate=drag.x/14;}
  const loveOpacity=sailing==="right"?1:Math.max(0,Math.min(1,drag.x/X_THRESHOLD));
  const skipOpacity=sailing==="left"?1:Math.max(0,Math.min(1,-drag.x/X_THRESHOLD));
  const buyOpacity=sailing==="up"?1:Math.max(0,Math.min(1,-drag.y/Y_THRESHOLD))*(Math.abs(drag.y)>Math.abs(drag.x)?1:0.3);
  const progress=Math.min(1,Math.max(Math.abs(x)/X_THRESHOLD,Math.abs(y)/Y_THRESHOLD));

  return <div className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-xl flex-col justify-center overflow-x-clip px-4 py-8">
    <div className="relative">
      {nextProduct&&<div aria-hidden className="absolute inset-0 border border-white/15 bg-[#eee9df] transition-transform duration-200" style={{transform:`scale(${0.94+0.06*progress})`}}>
        <div className="relative aspect-square"><Image src={nextProduct.imageKey||"/products/white-shirt-1.jpg"} alt="" fill sizes="(max-width:640px) 92vw, 576px" unoptimized draggable={false} className="object-contain p-[9%]"/></div>
      </div>}
      <div
        key={`${product.slug}-${index}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="relative z-10 cursor-grab touch-none select-none active:cursor-grabbing motion-reduce:transition-none"
        style={{transform:`translate3d(${x}px,${y}px,0) rotate(${rotate}deg)`,transition:dragging?"none":`transform ${SAIL_MS}ms cubic-bezier(.2,.7,.3,1)`}}
      >
        <div className="relative aspect-square overflow-hidden border border-white/15 bg-[#eee9df]">
          <Image src={product.imageKey||"/products/white-shirt-1.jpg"} alt={product.name} fill priority={index===0} sizes="(max-width:640px) 92vw, 576px" unoptimized draggable={false} className="pointer-events-none object-contain p-[9%]"/>
          <span aria-hidden className="pointer-events-none absolute left-5 top-6 -rotate-12 border-4 border-[var(--brand)] px-3 py-1 text-3xl font-black uppercase text-[var(--brand)]" style={{opacity:loveOpacity}}>Love it</span>
          <span aria-hidden className="pointer-events-none absolute right-5 top-6 rotate-12 border-4 border-black/70 px-3 py-1 text-3xl font-black uppercase text-black/70" style={{opacity:skipOpacity}}>Skip</span>
          <span aria-hidden className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 border-4 border-black bg-white px-3 py-1 text-3xl font-black uppercase text-black" style={{opacity:buyOpacity}}>Buy</span>
        </div>
        <div className="flex items-center justify-between gap-4 border-x border-b border-white/15 bg-[var(--surface)] p-4">
          <h1 className="text-xl font-black uppercase">{product.name}</h1>
          <Link href={`/designs/${product.slug}`} onPointerDown={(event)=>event.stopPropagation()} className="grid size-11 shrink-0 place-items-center bg-white text-black" aria-label={`Buy ${product.name}`}><ShoppingBag/></Link>
        </div>
      </div>
    </div>
    <div className="relative z-20 mt-5 grid grid-cols-2 gap-3"><button disabled={!!sailing} onClick={()=>sail("left")} className="flex h-16 items-center justify-center gap-2 border border-white/20 bg-white/5 font-black uppercase hover:bg-white/10"><ThumbsDown/>Skip</button><button disabled={!!sailing} onClick={()=>sail("right")} className="flex h-16 items-center justify-center gap-2 bg-[var(--brand)] font-black uppercase text-white hover:brightness-110"><Heart/>Love it</button></div>
    <p className="mt-4 text-center text-xs text-white/45">Swipe right to love, left to skip, up to buy. Anonymous design feedback. No personal profile required.</p>
  </div>;
}
