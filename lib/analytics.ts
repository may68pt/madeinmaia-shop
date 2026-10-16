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
  | "product_gallery"
  | "product_impression"
  | "site_click"
  | "outbound_click"
  | "page_exit"
  | "web_vital"
  | "client_error";

type EventOptions = {
  entityType?: "product" | "linklabel" | "collection" | "page";
  entityId?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
};

type AnalyticsPayload = {
  eventName: AnalyticsEventName;
  visitorId: string;
  sessionId: string;
  path: string;
  entityType?: EventOptions["entityType"];
  entityId?: string;
  referrer: string;
  device: "mobile" | "tablet" | "desktop";
  metadata: Record<string, string | number | boolean>;
};

const visitorKey="mim-analytics-visitor";
const sessionKey="mim-analytics-session";
const queue:AnalyticsPayload[]=[];
let flushTimer:number|undefined;

function identifier(storage:Storage,key:string){
  const existing=storage.getItem(key);
  if(existing)return existing;
  const value=crypto.randomUUID();
  storage.setItem(key,value);
  return value;
}

export function flushAnalytics(){
  if(typeof window==="undefined"||queue.length===0)return;
  if(flushTimer!==undefined){window.clearTimeout(flushTimer);flushTimer=undefined;}
  const batch=queue.splice(0,25);const body=JSON.stringify(batch);
  if(navigator.sendBeacon&&document.visibilityState==="hidden")navigator.sendBeacon("/api/analytics",new Blob([body],{type:"application/json"}));
  else void fetch("/api/analytics",{method:"POST",headers:{"content-type":"application/json"},body,keepalive:true}).catch(()=>{if(queue.length<100)queue.unshift(...batch);});
  if(queue.length)flushTimer=window.setTimeout(flushAnalytics,800);
}

export function trackEvent(eventName:AnalyticsEventName,options:EventOptions={}){
  if(typeof window==="undefined"||navigator.doNotTrack==="1"||window.location.pathname.startsWith("/studio"))return;
  const metadata=Object.fromEntries(Object.entries(options.metadata??{}).filter((entry):entry is [string,string|number|boolean]=>entry[1]!==undefined));
  queue.push({
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
  if(queue.length>=12)flushAnalytics();
  else if(flushTimer===undefined)flushTimer=window.setTimeout(flushAnalytics,800);
}
