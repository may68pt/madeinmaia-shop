"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Btn, CredsContext, Field, Note, cls, inputCls, type Creds } from "@/components/cyberpet/admin-kit";
import { ClassesTab, LogTab, OpsTab, OverviewTab, PetsTab } from "@/components/cyberpet/tabs-core";
import { CONTENT_TABS } from "@/components/cyberpet/tabs-content";

/* CyberPet back office: madeinmaia.pt/studio/cyberpet — same login as the Studio. */

const STORE = "cyberpet.admin";

export default function CyberPetAdmin() {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [tab, setTab] = useState("overview");
  const [opPet, setOpPet] = useState<string | null>(null);
  useEffect(() => {
    try { const c = JSON.parse(sessionStorage.getItem(STORE) || "null") as Creds | null; if (c?.user) setCreds(c); } catch { /* fresh login */ }
  }, []);
  if (!creds) return <Login onIn={(c) => { sessionStorage.setItem(STORE, JSON.stringify(c)); setCreds(c); }} />;

  const tabs: [string, string, ReactNode][] = [
    ["overview", "Overview", <OverviewTab key="o" />],
    ["pets", "Pets", <PetsTab key="p" onSendOp={(id) => { setOpPet(id); setTab("ops"); }} />],
    ["classes", "Classes", <ClassesTab key="c" />],
    ["ops", "Live ops", <OpsTab key="op" presetPet={opPet} />],
    ...CONTENT_TABS.map(([id, label, Comp]) => [id, label, <Comp key={id} />] as [string, string, ReactNode]),
    ["log", "Audit log", <LogTab key="l" />],
  ];
  return (
    <CredsContext.Provider value={creds}>
      <main className="min-h-screen bg-[#0c0a1f] text-white">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0c0a1f]/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
            <h1 className="mr-4 text-lg font-black tracking-tight"><span className="text-cyan-300">Cyber</span><span className="text-fuchsia-400">Pet</span> back office</h1>
            <nav className="flex flex-wrap gap-1">
              {tabs.map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={cls("rounded-lg px-3 py-1.5 text-sm font-semibold", tab === id ? "bg-white/15 text-white" : "text-white/60 hover:text-white")}>{label}</button>
              ))}
            </nav>
            <div className="ml-auto flex gap-2">
              <a href="/petz" target="_blank" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm">Open app ↗</a>
              <Btn kind="ghost" small onClick={() => { sessionStorage.removeItem(STORE); setCreds(null); }}>Sign out</Btn>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6">{tabs.find(([id]) => id === tab)?.[2]}</div>
      </main>
    </CredsContext.Provider>
  );
}

function Login({ onIn }: { onIn: (c: Creds) => void }) {
  const [user, setUser] = useState("madeinmaia");
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/petz/admin?resource=overview", { headers: { "x-studio-user": user.trim(), "x-studio-key": key } });
    if (r.ok) onIn({ user: user.trim(), key }); else setErr(r.status === 401 ? "Wrong username or password" : `Server error (${r.status})`);
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[#0c0a1f] p-4 text-white">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h1 className="text-xl font-black"><span className="text-cyan-300">Cyber</span><span className="text-fuchsia-400">Pet</span> back office</h1>
        <Field label="Studio user"><input className={inputCls} value={user} onChange={(e) => setUser(e.target.value)} /></Field>
        <Field label="Password"><input className={inputCls} type="password" value={key} onChange={(e) => setKey(e.target.value)} autoFocus /></Field>
        <Btn type="submit">Sign in</Btn>
        {err && <Note tone="error">{err}</Note>}
      </form>
    </main>
  );
}
