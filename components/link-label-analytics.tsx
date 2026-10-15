"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function LinkLabelView({id,type,category}:{id:string;type:string;category:string}){useEffect(()=>trackEvent("linklabel_view",{entityType:"linklabel",entityId:id,metadata:{type,category}}),[id,type,category]);return null;}
export function LinkLabelNext(){return <Link href={`/linklabel?again=${crypto.randomUUID()}`} onClick={()=>trackEvent("linklabel_next",{entityType:"linklabel"})} aria-label="Load more Link Label content" className="mim-link-label__load-more fixed bottom-4 right-4 z-30 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#d8ff42] px-5 py-3 text-sm font-black uppercase tracking-[.08em] text-black shadow-[0_12px_40px_rgba(0,0,0,.55)] transition hover:scale-[1.03] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8ff42] sm:bottom-6 sm:right-6 sm:px-6">Load more<ArrowDown className="size-4"/></Link>}
