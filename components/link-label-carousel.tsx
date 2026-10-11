"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export function LinkLabelCarousel({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % images.length), 5000);
    return () => window.clearInterval(timer);
  }, [images.length]);

  if (!images.length) return null;
  const go = (direction: -1 | 1) => setActive((current) => (current + direction + images.length) % images.length);

  return <div className="absolute inset-0 overflow-hidden bg-black" role="region" aria-roledescription="carousel" aria-label={title}>
    {images.map((src,index)=><div key={src+"-"+index} className={("absolute inset-0 transition-opacity duration-500 ")+(index===active?"z-[1] opacity-100":"opacity-0")} aria-hidden={index!==active}><Image src={src} alt={title+" — "+(index+1)+" of "+images.length} fill sizes="100vw" unoptimized priority={index===0} className="object-contain"/></div>)}
    {images.length>1&&<>
      <button type="button" onClick={()=>go(-1)} aria-label="Previous image" className="absolute left-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-white hover:text-black sm:left-6"><ChevronLeft/></button>
      <button type="button" onClick={()=>go(1)} aria-label="Next image" className="absolute right-4 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-white hover:text-black sm:right-6"><ChevronRight/></button>
      <div className="absolute bottom-28 left-1/2 z-10 flex max-w-[70vw] -translate-x-1/2 flex-wrap justify-center gap-2 sm:bottom-8">{images.map((_,index)=><button key={index} type="button" onClick={()=>setActive(index)} aria-label={"Go to image "+(index+1)} aria-current={index===active?"true":undefined} className={("size-2.5 rounded-full border border-white transition ")+(index===active?"scale-125 bg-[#d8ff42]":"bg-black/45 hover:bg-white")}/>)}</div>
    </>}
  </div>;
}
