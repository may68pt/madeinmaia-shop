"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LOCALES, UI_STRINGS, type Locale } from "@/lib/i18n";

type LocaleContextValue = { locale:Locale; setLocale:(locale:Locale)=>void; strings:Record<string,string> };
const LocaleContext=createContext<LocaleContextValue|null>(null);

export function LocaleProvider({children}:{children:React.ReactNode}){
  const [locale,setLocaleState]=useState<Locale>("en");
  useEffect(()=>{
    const stored=window.localStorage.getItem("mim-locale") as Locale|null;
    const browser=navigator.language.toLowerCase().split("-")[0] as Locale;
    setLocaleState(stored&&LOCALES.includes(stored)?stored:LOCALES.includes(browser)?browser:"en");
  },[]);
  function setLocale(next:Locale){
    setLocaleState(next);
    window.localStorage.setItem("mim-locale",next);
    document.cookie=`mim-locale=${next}; path=/; max-age=31536000; samesite=lax`;
  }
  useEffect(()=>{document.documentElement.lang=locale;},[locale]);
  const value=useMemo(()=>({locale,setLocale,strings:UI_STRINGS[locale]}),[locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(){
  const value=useContext(LocaleContext);
  if(!value)throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
