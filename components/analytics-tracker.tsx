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
  },[pathname,query]);
  return null;
}
