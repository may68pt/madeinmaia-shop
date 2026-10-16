"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function AnalyticsTracker(){
  const pathname=usePathname();
  const search=useSearchParams();
  const query=search.toString();
  useEffect(()=>{
    if(!pathname||pathname.startsWith("/studio"))return;
    const product=pathname.match(/^\/(?:designs|produto)\/([^/]+)/)?.[1];
    const collection=pathname.match(/^\/(?:collections|colecao)\/([^/]+)/)?.[1];
    trackEvent("page_view",{entityType:"page",entityId:pathname});
    if(product)trackEvent("product_view",{entityType:"product",entityId:product});
    if(collection)trackEvent("collection_view",{entityType:"collection",entityId:collection});
    const engagement=window.setTimeout(()=>trackEvent("engaged_session",{entityType:"page",entityId:pathname,metadata:{seconds:30}}),30_000);
    const sent=new Set<number>();
    const measure=()=>{const available=document.documentElement.scrollHeight-window.innerHeight;if(available<=0)return;const depth=Math.round(window.scrollY/available*100);for(const threshold of [50,90])if(depth>=threshold&&!sent.has(threshold)){sent.add(threshold);trackEvent("scroll_depth",{entityType:"page",entityId:pathname,metadata:{depth:threshold}});}};
    window.addEventListener("scroll",measure,{passive:true});
    return()=>{window.clearTimeout(engagement);window.removeEventListener("scroll",measure);};
  },[pathname,query]);
  return null;
}
