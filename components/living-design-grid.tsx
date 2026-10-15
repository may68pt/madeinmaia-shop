"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

export type LivingGridProduct = { slug:string; name:string; imageKey:string|null; previewColorIds?:string[]; salesRank?:number };
type GridColor = { id:string; hex:string; active:boolean };
type Tile = { product:LivingGridProduct; color:string; revision:number };
const TILE_COUNT=18;
function seededIndex(seed:number,length:number){return length?Math.abs((seed*9301+49297)%233280)%length:0;}

export function LivingDesignGrid({products,colors}:{products:LivingGridProduct[];colors:GridColor[]}){
  const palette=useMemo(()=>colors.filter((color)=>color.active),[colors]);
  const makeTile=useCallback((index:number,revision=0):Tile=>{const product=products[seededIndex(index+revision*17,products.length)];const preferred=palette.filter((color)=>product?.previewColorIds?.includes(color.id));const choices=preferred.length?preferred:palette;return{product,color:choices[seededIndex(index*7+revision*13,choices.length)]?.hex??"#eee9df",revision};},[palette,products]);
  const [tiles,setTiles]=useState<Tile[]>(()=>Array.from({length:TILE_COUNT},(_,index)=>makeTile(index)));
  useEffect(()=>{if(products.length<2)return;let timeout:number;const rotate=()=>{setTiles((current)=>{const next=[...current];const changes=8+Math.floor(Math.random()*5);const positions=[...Array(TILE_COUNT).keys()].sort(()=>Math.random()-.5).slice(0,changes);for(const position of positions)next[position]=makeTile(position,current[position].revision+1+Math.floor(Math.random()*31));return next;});timeout=window.setTimeout(rotate,5200+Math.random()*1800);};timeout=window.setTimeout(rotate,5600);return()=>window.clearTimeout(timeout);},[makeTile,products.length]);
  if(!products.length)return null;
  return <div className="mim-living-grid grid grid-cols-3" aria-label="Live design wall">{tiles.map(({product,color,revision},index)=><Link key={`${index}-${revision}`} href={`/designs/${product.slug}`} onClick={()=>trackEvent("product_click",{entityType:"product",entityId:product.slug,metadata:{source:"living_grid"}})} title={product.name} aria-label={`Open ${product.name}`} className="mim-living-grid__tile group relative aspect-square overflow-hidden border border-black/10" style={{backgroundColor:color}}><Image src={product.imageKey||"/products/white-shirt-1.jpg"} alt="" fill sizes="33.34vw" unoptimized className="object-contain p-[9%] drop-shadow-sm transition duration-700 group-hover:scale-110"/><span className="absolute inset-x-1 bottom-1 line-clamp-1 translate-y-2 bg-black/75 px-1.5 py-1 text-center text-[8px] font-black uppercase text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">{product.name}</span></Link>)}</div>;
}
