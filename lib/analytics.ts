"use client";

export type AnalyticsEventName =
  | "page_view"
  | "product_view"
  | "product_click"
  | "product_configure"
  | "add_to_cart"
  | "remove_from_cart"
  | "cart_open"
  | "begin_checkout"
  | "checkout_submit"
  | "checkout_redirect"
  | "linklabel_view"
  | "linklabel_action"
  | "linklabel_next"
  | "collection_view"
  | "search"
  | "engaged_session"
  | "scroll_depth"
  | "product_gallery";

type EventOptions = {
  entityType?: "product" | "linklabel" | "collection" | "page";
  entityId?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
};

const visitorKey="mim-analytics-visitor";
const sessionKey="mim-analytics-session";

function identifier(storage:Storage,key:string){
  const existing=storage.getItem(key);
  if(existing)return existing;
  const value=crypto.randomUUID();
  storage.setItem(key,value);
  return value;
}

export function trackEvent(eventName:AnalyticsEventName,options:EventOptions={}){
  if(typeof window==="undefined"||navigator.doNotTrack==="1"||window.location.pathname.startsWith("/studio"))return;
  const metadata=Object.fromEntries(Object.entries(options.metadata??{}).filter((entry):entry is [string,string|number|boolean]=>entry[1]!==undefined));
  const body=JSON.stringify({
    eventName,
    visitorId:identifier(window.localStorage,visitorKey),
    sessionId:identifier(window.sessionStorage,sessionKey),
    path:`${window.location.pathname}${window.location.search}`.slice(0,500),
    entityType:options.entityType,
    entityId:options.entityId?.slice(0,160),
    referrer:document.referrer,
    device:window.innerWidth<640?"mobile":window.innerWidth<1024?"tablet":"desktop",
    metadata,
  });
  if(navigator.sendBeacon){navigator.sendBeacon("/api/analytics",new Blob([body],{type:"application/json"}));return;}
  void fetch("/api/analytics",{method:"POST",headers:{"content-type":"application/json"},body,keepalive:true}).catch(()=>undefined);
}
