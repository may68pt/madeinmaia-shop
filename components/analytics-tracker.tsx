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
    const started=Date.now();
    let exitReported=false;
    const previousPath=window.sessionStorage.getItem("mim-analytics-path")||"entry";
    window.sessionStorage.setItem("mim-analytics-path",pathname);
    const product=pathname.match(/^\/(?:designs|produto)\/([^/]+)/)?.[1];
    const collection=pathname.match(/^\/(?:collections|colecao)\/([^/]+)/)?.[1];
    trackEvent("page_view",{entityType:"page",entityId:pathname,metadata:{previousPath}});
    if(product)trackEvent("product_view",{entityType:"product",entityId:product});
    if(collection)trackEvent("collection_view",{entityType:"collection",entityId:collection});
    const engagement=window.setTimeout(()=>trackEvent("engaged_session",{entityType:"page",entityId:pathname,metadata:{seconds:30}}),30_000);
    const sent=new Set<number>();
    const measure=()=>{const available=document.documentElement.scrollHeight-window.innerHeight;if(available<=0)return;const depth=Math.round(window.scrollY/available*100);for(const threshold of [50,90])if(depth>=threshold&&!sent.has(threshold)){sent.add(threshold);trackEvent("scroll_depth",{entityType:"page",entityId:pathname,metadata:{depth:threshold}});}};
    window.addEventListener("scroll",measure,{passive:true});
    const click=(event:MouseEvent)=>{const target=event.target instanceof Element?event.target.closest("a,button"):null;if(!target)return;const label=(target.getAttribute("aria-label")||target.textContent||"").trim().replace(/\s+/g," ").slice(0,80);const href=target instanceof HTMLAnchorElement?target.href:"";if(href){try{const url=new URL(href);if(url.host!==window.location.host){trackEvent("outbound_click",{entityType:"page",entityId:pathname,metadata:{host:url.host,label}});return;}trackEvent("site_click",{entityType:"page",entityId:pathname,metadata:{label,destination:url.pathname}});}catch{return;}}else if(label)trackEvent("site_click",{entityType:"page",entityId:pathname,metadata:{label,control:"button"}});};
    const reportExit=()=>{if(exitReported)return;exitReported=true;trackEvent("page_exit",{entityType:"page",entityId:pathname,metadata:{seconds:Math.max(0,Math.round((Date.now()-started)/1000))}});};
    window.addEventListener("click",click,{capture:true});
    window.addEventListener("pagehide",reportExit);
    return()=>{window.clearTimeout(engagement);window.removeEventListener("scroll",measure);window.removeEventListener("click",click,{capture:true});window.removeEventListener("pagehide",reportExit);reportExit();};
  },[pathname,query]);

  useEffect(()=>{
    let cls=0;let lcp=0;
    const observers:PerformanceObserver[]=[];
    try{const lcpObserver=new PerformanceObserver((list)=>{const entries=list.getEntries();lcp=entries.at(-1)?.startTime??lcp;});lcpObserver.observe({type:"largest-contentful-paint",buffered:true});observers.push(lcpObserver);}catch{}
    try{const clsObserver=new PerformanceObserver((list)=>{for(const entry of list.getEntries() as Array<PerformanceEntry&{value?:number;hadRecentInput?:boolean}>)if(!entry.hadRecentInput)cls+=entry.value??0;});clsObserver.observe({type:"layout-shift",buffered:true});observers.push(clsObserver);}catch{}
    const report=()=>{if(lcp)trackEvent("web_vital",{entityType:"page",entityId:window.location.pathname,metadata:{metric:"LCP",value:Math.round(lcp)}});trackEvent("web_vital",{entityType:"page",entityId:window.location.pathname,metadata:{metric:"CLS",value:Math.round(cls*1000)/1000}});};
    const error=(event:ErrorEvent)=>trackEvent("client_error",{entityType:"page",entityId:window.location.pathname,metadata:{type:"error",message:String(event.message||"Unknown error").replace(/https?:\/\/\S+/g,"[url]").slice(0,180)}});
    const rejection=(event:PromiseRejectionEvent)=>trackEvent("client_error",{entityType:"page",entityId:window.location.pathname,metadata:{type:"promise",message:String(event.reason instanceof Error?event.reason.message:event.reason||"Unhandled rejection").replace(/https?:\/\/\S+/g,"[url]").slice(0,180)}});
    window.addEventListener("error",error);window.addEventListener("unhandledrejection",rejection);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")report();},{once:true});
    return()=>{observers.forEach((observer)=>observer.disconnect());window.removeEventListener("error",error);window.removeEventListener("unhandledrejection",rejection);};
  },[]);
  return null;
}
