"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu,ShoppingBag,X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Sheet,SheetContent,SheetHeader,SheetTitle,SheetTrigger } from "@/components/ui/sheet";
import { removeCartItem,useCart } from "@/lib/cart";
import { LOCALES,UI_STRINGS,translatedNavigation,type Locale } from "@/lib/i18n";
import { DEFAULT_NAVIGATION,type NavigationItem } from "@/lib/site-navigation";

type Props={navigation?:NavigationItem[];locale?:Locale;onLocaleChange?:(locale:Locale)=>void;announcement?:boolean};

export function StoreHeader({navigation=DEFAULT_NAVIGATION,locale:controlledLocale,onLocaleChange,announcement=false}:Props){
  const [localLocale,setLocalLocale]=useState<Locale>("en");
  const locale=controlledLocale??localLocale;
  const strings=UI_STRINGS[locale];
  const cart=useCart();
  const quantity=cart.reduce((sum,item)=>sum+item.quantity,0);
  const total=cart.reduce((sum,item)=>sum+item.priceCents*item.quantity,0);
  function changeLocale(next:Locale){if(onLocaleChange)onLocaleChange(next);else setLocalLocale(next);window.localStorage.setItem("mim-locale",next);document.documentElement.lang=next;}
  const visibleNavigation=navigation.filter((item)=>item.visible);
  const route=(item:NavigationItem)=>item.id==="collections"?"/collections":item.id==="discover"?"/linklabel":item.url;
  return <>
    {announcement&&<div id="mim-announcement" className="mim-announcement border-b border-white/10 bg-black px-5 py-2 text-center text-sm font-medium tracking-wide text-white">{strings.announcement}</div>}
    <header id="mim-site-header" className="mim-site-header sticky top-0 z-40 border-b border-white/10 bg-[color:var(--paper)]/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-2 sm:gap-5 sm:px-5 sm:py-3 lg:px-10">
        <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="shrink-0 text-white lg:hidden" aria-label={strings.menu}><Menu/></Button></SheetTrigger><SheetContent side="left" className="storefront-dark border-white/10 bg-[var(--paper)] p-7 text-white"><SheetHeader><SheetTitle className="text-left text-2xl text-white">{strings.explore}</SheetTitle></SheetHeader><nav className="mt-8 grid gap-5 text-lg">{visibleNavigation.map((item)=><Link key={item.id} href={route(item)}>{translatedNavigation(item.id,item.label,locale)}</Link>)}</nav></SheetContent></Sheet>
        <Link href="/loja" className="mim-site-header__logo mr-auto block min-w-0" aria-label="Made in Maia, início"><BrandLogo className="h-12 w-auto sm:h-16"/></Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">{visibleNavigation.map((item)=><div key={item.id} className="group/nav relative py-4"><Link href={route(item)}>{translatedNavigation(item.id,item.label,locale)}</Link>{item.children?.some((child)=>child.visible)&&<div className="invisible absolute left-1/2 top-full z-50 min-w-52 -translate-x-1/2 border border-white/10 bg-[#171715] p-2 opacity-0 shadow-2xl transition group-hover/nav:visible group-hover/nav:opacity-100 group-focus-within/nav:visible group-focus-within/nav:opacity-100">{item.children.filter((child)=>child.visible).map((child)=><Link key={child.id} href={child.id.startsWith("collection-")?`/collections/${child.id.slice("collection-".length)}`:child.url} className="block px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white">{child.label}</Link>)}</div>}</div>)}</nav>
        <label className="sr-only" htmlFor="mim-language">Language</label><select id="mim-language" value={locale} onChange={(event)=>changeLocale(event.target.value as Locale)} className="bg-transparent text-xs font-black uppercase text-white">{LOCALES.map((item)=><option key={item} value={item}>{item}</option>)}</select>
        <Sheet><SheetTrigger asChild><Button variant="ghost" className="relative shrink-0 text-white" size="icon" aria-label={strings.viewBag}><ShoppingBag/>{quantity>0&&<span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[var(--brand)] text-[11px] font-bold text-white">{quantity}</span>}</Button></SheetTrigger><SheetContent className="storefront-dark flex flex-col border-white/10 bg-[var(--paper)] p-5 text-white sm:max-w-md sm:p-6"><SheetHeader><SheetTitle className="text-left text-3xl font-black uppercase tracking-tight text-white">{strings.bag}</SheetTitle></SheetHeader><div className="mt-6 flex-1 space-y-3 overflow-y-auto">{cart.length===0?<p className="border border-dashed border-white/20 p-7 text-center text-white/55">{strings.emptyBag}</p>:cart.map((item)=><div key={item.key} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 bg-white/5 p-3"><div className="relative size-16 overflow-hidden bg-white"><Image src={item.image} alt="" fill sizes="64px" unoptimized={item.image.startsWith("http")} className="object-contain"/></div><div className="min-w-0"><strong className="line-clamp-2 text-sm uppercase">{item.name}</strong><p className="mt-1 text-xs text-white/55">{item.size} · {item.color} · {item.quantity}×</p><p className="mt-1 font-bold">{((item.priceCents*item.quantity)/100).toFixed(2).replace(".",",")} €</p></div><Button size="icon" variant="ghost" onClick={()=>removeCartItem(item.key)} aria-label={`${strings.remove} ${item.name}`}><X className="size-4"/></Button></div>)}</div><div className="border-t border-white/15 pt-5"><div className="mb-4 flex justify-between text-lg font-bold"><span>Total</span><span>{(total/100).toFixed(2).replace(".",",")} €</span></div>{cart.length>0?<Button asChild className="h-13 w-full rounded-none bg-[var(--brand)] text-base font-black uppercase text-white"><Link href="/checkout">{strings.checkout}</Link></Button>:<Button disabled className="h-13 w-full rounded-none">{strings.checkout}</Button>}<p className="mt-3 text-center text-xs text-white/50">{strings.secureCheckout}</p></div></SheetContent></Sheet>
      </div>
    </header>
  </>;
}
