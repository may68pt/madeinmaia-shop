"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { normalizeAnalyticsPath, type AnalyticsEvent } from "@/lib/analytics";

/** Tiny first-party, cookieless aggregated measurement. No session storage or fingerprinting. */
export function trackShopEvent(event: AnalyticsEvent, pathname?: string) {
  if (typeof window === "undefined") return;
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const path = normalizeAnalyticsPath(pathname ?? window.location.pathname);
  if (!path) return;
  const body = JSON.stringify({ event, path });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
  } else {
    void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => undefined);
  }
}

export function AnalyticsTracker() {
  const path = usePathname();
  useEffect(() => {
    const normalized = normalizeAnalyticsPath(path);
    if (!normalized) return;
    trackShopEvent("page_view", normalized);
    if (/^\/(?:designs|produto)\/[^/]+$/.test(normalized)) trackShopEvent("product_view", normalized);
  }, [path]);
  return null;
}
