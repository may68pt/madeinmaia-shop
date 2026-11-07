"use client";

import { useCallback, useContext, useEffect, useState } from "react";
import { Btn, CredsContext, Field, Note, Panel, Stat, inputCls, useApi } from "./admin-kit";
import { CATEGORIES, TIERS, TIER_COLOR } from "@/lib/cyberpet/items-core";

const API = "/api/petz/admin";
type Item = {
  id: string; name: string; description: string; tier: string; category: string; art_url: string;
  room: { h: number; kind?: string; comfort: number; react?: string }; stats: Record<string, number>;
  price_coins: number; price_gems: number; price_cents: number | null; supply_limit: number | null; sold: number; left: number | null;
  in_shop: boolean; active: boolean; owners: number;
};
const blank = (): Item => ({ id: "", name: "", description: "", tier: "rare", category: "decor", art_url: "", room: { h: 0.14, kind: "floor", comfort: 3 }, stats: {}, price_coins: 200, price_gems: 0, price_cents: null, supply_limit: null, sold: 0, left: null, in_shop: true, active: true, owners: 0 });

/** Rare item dashboard and editor: tiers, supply, prices (⚡, 💎, €), art and a live room preview. */
export function ItemsTab() {
  const api = useApi();
  const creds = useContext(CredsContext);
  const [items, setItems] = useState<Item[]>([]);
  const [tiers, setTiers] = useState<Record<string, { items: number; circulating: number }>>({});
  const [byVia, setByVia] = useState<{ via: string; n: number }[]>([]);
  const [f, setF] = useState<Item>(blank());
  const [give, setGive] = useState("");
  const [msg, setMsg] = useState<{ t: string; tone: "ok" | "error" } | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ items: Item[]; tiers: typeof tiers; byVia: typeof byVia }>(`${API}?resource=items`);
    if (r.ok) { setItems(r.items); setTiers(r.tiers); setByVia(r.byVia); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);
  const save = async () => {
    const r = await api<{ id: string }>(API, { action: "item-save", item: f });
    setMsg(r.ok ? { t: `Saved ${r.id}`, tone: "ok" } : { t: r.error || "Failed", tone: "error" });
    if (r.ok) { setF({ ...f, id: r.id }); void load(); }
  };
  const upload = async (file: File) => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media/upload", { method: "POST", body: fd, headers: { "x-studio-user": creds.user, "x-studio-key": creds.key } });
    const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (j.url) setF((x) => ({ ...x, art_url: j.url as string })); else setMsg({ t: j.error || "Upload failed", tone: "error" });
  };
  const grant = async () => {
    const r = await api<{ results: Record<string, string> }>(API, { action: "item-grant", item: f.id, petIds: give.split(/[\s,;]+/).filter(Boolean) });
    setMsg(r.ok ? { t: Object.entries(r.results).map(([k, v]) => `${k}: ${v}`).join(" · "), tone: "ok" } : { t: r.error || "Failed", tone: "error" });
    void load();
  };
  const num = (v: string) => (v === "" ? null : Number(v));
  const total = Object.values(tiers).reduce((s, t) => s + t.circulating, 0);
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Items" value={items.length} />
        <Stat label="In circulation" value={total} />
        {byVia.slice(0, 4).map((v) => <Stat key={v.via} label={`via ${v.via}`} value={v.n} />)}
      </div>
      <div className="flex flex-wrap gap-2">
        {TIERS.map((t) => <span key={t} className="rounded-full px-3 py-1 text-xs font-bold text-black" style={{ background: TIER_COLOR[t] }}>{t}: {tiers[t]?.items ?? 0} items · {tiers[t]?.circulating ?? 0} owned</span>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
        <Panel title="Items" right={<Btn small kind="ghost" onClick={() => setF(blank())}>New item</Btn>}>
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase text-white/40"><tr><th>Item</th><th>Tier</th><th>Price</th><th>Owners</th><th>Left</th><th>Shop</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} onClick={() => setF(i)} className={"cursor-pointer border-t border-white/5 hover:bg-white/5 " + (i.active ? "" : "opacity-40")}>
                  <td className="flex items-center gap-2 py-1.5">{i.art_url ? <img src={i.art_url} alt="" className="h-8 w-8 object-contain" /> : <span className="h-8 w-8 rounded bg-white/10" />}<span><b>{i.name}</b><div className="font-mono text-[10px] text-white/40">{i.id}</div></span></td>
                  <td><span style={{ color: TIER_COLOR[i.tier] }}>{i.tier}</span></td>
                  <td className="text-xs">{[i.price_coins && `${i.price_coins}⚡`, i.price_gems && `${i.price_gems}💎`, i.price_cents && `€${(i.price_cents / 100).toFixed(2)}`].filter(Boolean).join(" · ") || "free"}</td>
                  <td>{i.owners}</td><td>{i.left ?? "∞"}</td><td>{i.in_shop ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <Note>No rare items yet. Create one on the right.</Note>}
        </Panel>
        <Panel title={f.id ? `Edit ${f.name || f.id}` : "New item"}>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Id" hint="rx_ is added for you"><input className={inputCls} value={f.id} onChange={(e) => setF({ ...f, id: e.target.value })} /></Field>
              <Field label="Name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Tier"><select className={inputCls} value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Category"><select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            </div>
            <Field label="Description"><input className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <Field label="Art" hint="Transparent PNG or WebP, item standing on its base">
              <div className="flex gap-2"><input className={inputCls} value={f.art_url} onChange={(e) => setF({ ...f, art_url: e.target.value })} placeholder="/uploads/…" />
                <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-xs">Upload<input type="file" accept="image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label></div>
            </Field>
            {/* live preview: the item on a room floor next to a pet-sized marker */}
            <div className="relative h-40 overflow-hidden rounded-xl" style={{ background: "linear-gradient(#2a2058 0 70%, #1a1438 70%)" }}>
              <div className="absolute bottom-[18%] left-[30%] h-[55%] w-[18%] rounded-t-full bg-white/10 text-center text-[10px] text-white/40">pet</div>
              {f.art_url && <img src={f.art_url} alt="" className="absolute left-[60%] -translate-x-1/2 object-contain" style={{ height: `${f.room.h * 220}%`, bottom: f.room.kind === "wall" ? "45%" : "18%", filter: `drop-shadow(0 0 10px ${TIER_COLOR[f.tier]})` }} />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Height in room"><input className={inputCls} value={f.room.h} onChange={(e) => setF({ ...f, room: { ...f.room, h: Number(e.target.value) } })} /></Field>
              <Field label="Placement"><select className={inputCls} value={f.room.kind} onChange={(e) => setF({ ...f, room: { ...f.room, kind: e.target.value } })}><option value="floor">floor</option><option value="wall">wall</option></select></Field>
              <Field label="Comfort"><input className={inputCls} value={f.room.comfort} onChange={(e) => setF({ ...f, room: { ...f.room, comfort: Number(e.target.value) } })} /></Field>
              <Field label="Tap reaction"><select className={inputCls} value={f.room.react || ""} onChange={(e) => setF({ ...f, room: { ...f.room, react: e.target.value || undefined } })}><option value="">auto</option>{["wiggle", "bounce", "flicker", "pulse", "secret"].map((r) => <option key={r}>{r}</option>)}</select></Field>
              <Field label="Price ⚡"><input className={inputCls} value={f.price_coins} onChange={(e) => setF({ ...f, price_coins: Number(e.target.value) })} /></Field>
              <Field label="Price 💎"><input className={inputCls} value={f.price_gems} onChange={(e) => setF({ ...f, price_gems: Number(e.target.value) })} /></Field>
              <Field label="Price € (cents)"><input className={inputCls} value={f.price_cents ?? ""} onChange={(e) => setF({ ...f, price_cents: num(e.target.value) })} placeholder="none" /></Field>
              <Field label="Supply limit"><input className={inputCls} value={f.supply_limit ?? ""} onChange={(e) => setF({ ...f, supply_limit: num(e.target.value) })} placeholder="∞" /></Field>
              <Field label="Sold"><input className={inputCls} value={f.sold} disabled /></Field>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.in_shop} onChange={(e) => setF({ ...f, in_shop: e.target.checked })} /> Always in shop</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
            </div>
            <Note>Exclusive items never show in the shop: they come from releases, QR codes or gifts. Untick “Always in shop” to sell an item only through timed releases.</Note>
            <Btn onClick={save} disabled={!f.name}>Save item</Btn>
            {f.id && (
              <div className="grid gap-2 border-t border-white/10 pt-3">
                <Field label="Give to pets now"><input className={inputCls} placeholder="pet ids" value={give} onChange={(e) => setGive(e.target.value)} /></Field>
                <Btn kind="ghost" onClick={grant} disabled={!give}>Give item</Btn>
              </div>
            )}
            {msg && <Note tone={msg.tone}>{msg.t}</Note>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
