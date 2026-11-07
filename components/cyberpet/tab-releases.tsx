"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Field, Note, Panel, ScopePicker, emptyScope, fmtDate, inputCls, scopeBody, useApi, type ScopeValue } from "./admin-kit";
import { useClasses } from "./tabs-core";
import { TIER_COLOR } from "@/lib/cyberpet/items-core";

const API = "/api/petz/admin";
type Release = {
  id: number; name: string; item_ids: string[]; channel: string; scope: string; class_name: string | null; pet_ids: string[];
  starts_at: string; ends_at: string | null; status: string; qr_code: string | null; url: string | null; qr: string | null;
  max_claims: number | null; claims: number;
};
type ItemLite = { id: string; name: string; tier: string; art_url: string };
const CH: Record<string, string> = { gift: "🎁 Gift", shop: "🛍️ Shop", qr: "🔓 QR unlock" };

function phase(r: Release, now: number) {
  if (r.status !== "live") return r.status;
  if (Date.parse(r.starts_at) > now) return "upcoming";
  if (r.ends_at && Date.parse(r.ends_at) <= now) return "ended";
  return "live";
}

/** Release calendar and editor: drop items as gifts, put them on sale for a window, or print a QR code for a t-shirt batch. */
export function ReleasesTab() {
  const api = useApi();
  const { classes } = useClasses();
  const [rel, setRel] = useState<Release[]>([]);
  const [items, setItems] = useState<ItemLite[]>([]);
  const [f, setF] = useState({ id: 0, name: "", channel: "gift", items: [] as string[], startsAt: "", endsAt: "", maxClaims: "", status: "live" });
  const [scope, setScope] = useState<ScopeValue>({ ...emptyScope, includeNew: true });
  const [msg, setMsg] = useState<{ t: string; tone: "ok" | "error" } | null>(null);
  const load = useCallback(async () => {
    const [r, i] = await Promise.all([api<{ releases: Release[] }>(`${API}?resource=releases`), api<{ items: ItemLite[] }>(`${API}?resource=items`)]);
    if (r.ok) setRel(r.releases); if (i.ok) setItems(i.items);
  }, [api]);
  useEffect(() => { const id = setTimeout(() => void load(), 0); return () => clearTimeout(id); }, [load]);
  const itemName = (id: string) => items.find((i) => i.id === id)?.name || id;
  const save = async () => {
    const r = await api<{ id: number }>(API, { action: "release-save", ...f, ...scopeBody(scope), id: f.id || undefined,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : undefined, endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined });
    setMsg(r.ok ? { t: "Release saved", tone: "ok" } : { t: r.error || "Failed", tone: "error" });
    if (r.ok) { setF({ ...f, id: 0, name: "" }); void load(); }
  };
  const status = async (id: number, s: string) => { await api(API, { action: "release-status", id, status: s }); void load(); };
  const local = (v: string | null) => (v ? new Date(new Date(v).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
  const edit = (r: Release) => setF({ id: r.id, name: r.name, channel: r.channel, items: r.item_ids, startsAt: local(r.starts_at), endsAt: local(r.ends_at), maxClaims: r.max_claims ? String(r.max_claims) : "", status: r.status === "draft" ? "draft" : "live" });

  // calendar strip: 8 weeks around today, one row per release
  const [now, setNow] = useState(0);
  useEffect(() => { const tick = () => setNow(Date.now()); const id = setTimeout(tick, 0), iv = setInterval(tick, 60000); return () => { clearTimeout(id); clearInterval(iv); }; }, []);
  const span = { s: now - 14 * 864e5, e: now + 42 * 864e5 };
  const pos = (t: number) => Math.max(0, Math.min(100, ((t - span.s) / (span.e - span.s)) * 100));
  return (
    <div className="grid gap-4">
      <Panel title="Release calendar" right={<span className="text-xs text-white/40">2 weeks back · 6 weeks ahead</span>}>
        <div className="relative grid gap-1.5">
          <div className="absolute bottom-0 top-0 w-px bg-fuchsia-400" style={{ left: `${pos(now)}%` }} />
          {rel.slice(0, 20).map((r) => {
            const a = pos(Date.parse(r.starts_at)), b = pos(r.ends_at ? Date.parse(r.ends_at) : span.e), ph = phase(r, now);
            return (
              <div key={r.id} className="relative h-6 rounded bg-white/[0.03]">
                <div className={"absolute top-0 h-6 rounded px-2 text-[11px] leading-6 " + (ph === "live" ? "bg-cyan-400/70 text-black" : ph === "upcoming" ? "bg-fuchsia-500/60" : "bg-white/15 text-white/60")}
                  style={{ left: `${a}%`, width: `${Math.max(2, b - a)}%` }}>{CH[r.channel]?.split(" ")[0]} {r.name}</div>
              </div>
            );
          })}
          {!rel.length && <Note>No releases yet.</Note>}
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
        <Panel title="Releases">
          <div className="grid gap-2">
            {rel.map((r) => {
              const ph = phase(r, now);
              return (
                <div key={r.id} className="grid gap-2 rounded-xl border border-white/10 p-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><b>{r.name}</b><span className="text-xs">{CH[r.channel]}</span>
                      <span className={"rounded-full px-2 text-[11px] font-bold " + (ph === "live" ? "bg-emerald-400 text-black" : ph === "upcoming" ? "bg-fuchsia-500" : "bg-white/15")}>{ph}</span></div>
                    <div className="text-xs text-white/60">{r.item_ids.map(itemName).join(", ")}</div>
                    <div className="text-xs text-white/40">{fmtDate(r.starts_at)} → {r.ends_at ? fmtDate(r.ends_at) : "no end"} · {r.scope === "class" ? `class ${r.class_name}` : r.scope === "pets" ? `${r.pet_ids.length} pets` : "all pets"}{r.channel === "qr" && ` · ${r.claims}${r.max_claims ? "/" + r.max_claims : ""} claims`}</div>
                    {r.url && <div className="mt-1 font-mono text-[11px] text-cyan-300">{r.url}</div>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Btn small kind="ghost" onClick={() => edit(r)}>Edit</Btn>
                      {r.status !== "live" && <Btn small kind="ghost" onClick={() => status(r.id, "live")}>Go live</Btn>}
                      {r.status === "live" && <Btn small kind="ghost" onClick={() => status(r.id, "paused")}>Pause</Btn>}
                      {r.status !== "ended" && <Btn small kind="danger" onClick={() => status(r.id, "ended")}>End</Btn>}
                    </div>
                  </div>
                  {r.qr && <a href={r.qr} download={`cyberpet-${r.qr_code}.png`} title="Download QR"><img src={r.qr} alt="QR code" className="h-28 w-28 rounded-lg bg-white p-1" /></a>}
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title={f.id ? "Edit release" : "New release"}>
          <div className="grid gap-3">
            <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Halloween drop, T-shirt batch 3…" /></Field>
            <Field label="How it arrives">
              <div className="flex gap-2">{Object.entries(CH).map(([k, v]) => <button key={k} type="button" onClick={() => setF({ ...f, channel: k })} className={"rounded-full px-3 py-1 text-xs font-bold " + (f.channel === k ? "bg-cyan-400 text-black" : "border border-white/15")}>{v}</button>)}</div>
            </Field>
            <Note>{f.channel === "gift" ? "Every pet in scope gets the items on its next sync." : f.channel === "shop" ? "The items go on sale in the rare shop for the window, at their prices." : "You get a QR code and link. Print it on a t-shirt tag: scanning unlocks the items once per pet."}</Note>
            <Field label="Items">
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-auto">
                {items.map((i) => (
                  <button key={i.id} type="button" onClick={() => setF({ ...f, items: f.items.includes(i.id) ? f.items.filter((x) => x !== i.id) : [...f.items, i.id] })}
                    className={"rounded-full border px-2 py-0.5 text-xs " + (f.items.includes(i.id) ? "bg-white text-black" : "border-white/15")} style={{ borderColor: TIER_COLOR[i.tier] }}>{i.name}</button>
                ))}
                {!items.length && <span className="text-xs text-white/40">Create items in Rare items first</span>}
              </div>
            </Field>
            <ScopePicker value={scope} onChange={setScope} classes={classes} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Starts"><input type="datetime-local" className={inputCls} value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></Field>
              <Field label="Ends (optional)"><input type="datetime-local" className={inputCls} value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></Field>
              {f.channel === "qr" && <Field label="Max unlocks"><input className={inputCls} value={f.maxClaims} onChange={(e) => setF({ ...f, maxClaims: e.target.value })} placeholder="∞" /></Field>}
              <Field label="Status"><select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="live">Live (at start time)</option><option value="draft">Draft</option></select></Field>
            </div>
            <div className="flex gap-2"><Btn onClick={save} disabled={!f.name || !f.items.length}>Save release</Btn>{f.id ? <Btn kind="ghost" onClick={() => setF({ ...f, id: 0 })}>New instead</Btn> : null}</div>
            {msg && <Note tone={msg.tone}>{msg.t}</Note>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
