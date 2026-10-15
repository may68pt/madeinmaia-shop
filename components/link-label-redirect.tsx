"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function LinkLabelRedirect({ href, title }: { href: string; title: string }) {
  const [seconds, setSeconds] = useState(3);
  const safeHref = (() => {
    if (href.startsWith("/") && !href.startsWith("//")) return href;
    try {
      const url = new URL(href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!safeHref) return;
    const target = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(target);
          trackEvent("linklabel_action",{entityType:"linklabel",entityId:title,metadata:{action:"automatic_redirect"}});
          window.location.assign(safeHref);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(target);
  }, [safeHref, title]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 bg-gradient-to-t from-black via-black/90 to-transparent px-5 pb-8 pt-24 text-center sm:pb-10">
      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
        Redirecting to {title} in
      </p>
      <div aria-live="polite" className="text-6xl font-black leading-none text-[#d8ff42]">
        {seconds}
      </div>
      {safeHref&&<a href={safeHref} onClick={()=>trackEvent("linklabel_action",{entityType:"linklabel",entityId:title,metadata:{action:"open_now"}})} className="mt-1 inline-flex items-center gap-2 text-xs font-black uppercase text-white underline decoration-white/35 underline-offset-4 hover:decoration-white">
        Open now <ArrowUpRight className="size-4" />
      </a>}
    </div>
  );
}
