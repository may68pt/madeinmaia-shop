"use client";

import Link from "next/link";
import { FormEvent,Suspense,useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";

function ResetForm(){
  const token=useSearchParams().get("token")??"";
  const [message,setMessage]=useState("");
  const [complete,setComplete]=useState(false);
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage("");
    const form=new FormData(event.currentTarget);
    const password=String(form.get("password")??"");
    if(password!==String(form.get("confirmation")??""))return setMessage("The passwords do not match.");
    setBusy(true);
    const response=await fetch("/api/account/password-reset",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"reset",token,password})});
    const data=await response.json() as {error?:string};setBusy(false);
    if(!response.ok)return setMessage(data.error??"Could not reset your password.");
    setComplete(true);
  }
  if(complete)return <div className="mt-8 border border-white/15 bg-white/5 p-6"><h2 className="text-2xl font-black uppercase">Password updated</h2><p className="mt-2 text-white/55">Your previous sessions were closed. You can now sign in with the new password.</p><Link href="/conta" className="mt-5 inline-flex bg-[var(--brand)] px-5 py-3 font-black uppercase text-white">Sign in</Link></div>;
  return <form onSubmit={submit} className="mt-8 grid gap-4"><label className="grid gap-1 text-xs font-black uppercase">New password<input required minLength={10} maxLength={128} name="password" type="password" autoComplete="new-password" className="h-12 border border-white/15 bg-white/5 px-4 text-base normal-case text-white"/></label><label className="grid gap-1 text-xs font-black uppercase">Confirm password<input required minLength={10} maxLength={128} name="confirmation" type="password" autoComplete="new-password" className="h-12 border border-white/15 bg-white/5 px-4 text-base normal-case text-white"/></label>{message&&<p className="text-sm text-red-400">{message}</p>}<button disabled={busy||!token} className="h-13 bg-[var(--brand)] font-black uppercase text-white disabled:opacity-40">{busy?"Updating…":"Update password"}</button>{!token&&<p className="text-sm text-red-400">This reset link is incomplete.</p>}</form>;
}

export default function PasswordResetPage(){return <main className="storefront-dark min-h-screen bg-[var(--paper)] text-white"><header className="border-b border-white/10 px-4 py-3 sm:px-8"><Link href="/loja"><BrandLogo className="h-14 w-auto"/></Link></header><section className="mx-auto max-w-md px-5 py-16"><p className="text-xs font-black uppercase tracking-[.2em] text-[var(--brand)]">Made in Maia</p><h1 className="mt-2 text-5xl font-black uppercase">New password</h1><p className="mt-4 text-white/50">Choose a password with at least 10 characters.</p><Suspense fallback={<p className="mt-8 text-white/50">Loading…</p>}><ResetForm/></Suspense></section></main>}
